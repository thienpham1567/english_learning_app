import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	toeicSpeakingPrompt,
	toeicSpeakingResponse,
	toeicSpeakingSession,
} from "@repo/database";
import { and, eq } from "drizzle-orm";
import { transcribeAudio, gradeSpeaking, type SpeakingType } from "@/lib/toeic/speaking-grader";
import { recordLearningEvent } from "@repo/modules";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;

	const formData = await req.formData();
	const sessionId = String(formData.get("sessionId") ?? "");
	const promptId = String(formData.get("promptId") ?? "");
	const durationMs = Number(formData.get("durationMs") ?? 0);
	const audioBlob = formData.get("audio");

	if (!sessionId || !promptId || !audioBlob || !(audioBlob instanceof Blob)) {
		return Response.json({ error: "Missing required fields" }, { status: 400 });
	}

	const [s] = await db
		.select()
		.from(toeicSpeakingSession)
		.where(and(eq(toeicSpeakingSession.id, sessionId), eq(toeicSpeakingSession.userId, userId)))
		.limit(1);
	if (!s) return Response.json({ error: "Session not found" }, { status: 404 });

	const [prompt] = await db
		.select()
		.from(toeicSpeakingPrompt)
		.where(eq(toeicSpeakingPrompt.id, promptId))
		.limit(1);
	if (!prompt) return Response.json({ error: "Prompt not found" }, { status: 404 });

	// Persist audio to disk so we can transcribe (and optionally retain for review)
	const audioId = crypto.randomBytes(8).toString("hex");
	const audioDir = join(process.cwd(), "public/toeic/audio/speaking-uploads");
	await mkdir(audioDir, { recursive: true });
	const audioPath = join(audioDir, `${userId.slice(0, 8)}_${audioId}.webm`);
	const arrayBuffer = await audioBlob.arrayBuffer();
	await writeFile(audioPath, Buffer.from(arrayBuffer));

	// Transcribe + grade
	let transcript = "";
	let grade: { rawScore: number; rubricScores: Record<string, number>; feedbackVi: string };
	try {
		transcript = await transcribeAudio(audioPath, "audio/webm");
		grade = await gradeSpeaking({
			type: prompt.type as SpeakingType,
			maxScore: prompt.maxScore,
			transcript,
			durationMs,
			context: {
				textToRead: prompt.textToRead ?? undefined,
				imageUrl: prompt.imageUrl ?? undefined,
				questionText: prompt.questionText ?? undefined,
				contextText: prompt.contextText ?? undefined,
				topic: prompt.topic ?? undefined,
			},
		});
	} catch (err) {
		grade = {
			rawScore: 0,
			rubricScores: {},
			feedbackVi: `Transcribe/grade failed: ${err instanceof Error ? err.message : "unknown"}`,
		};
	}

	await db
		.insert(toeicSpeakingResponse)
		.values({
			sessionId,
			promptId,
			audioPath: audioPath.replace(join(process.cwd(), "public"), ""),
			transcript,
			durationMs,
			rubricScores: grade.rubricScores,
			rawScore: grade.rawScore,
			feedbackVi: grade.feedbackVi,
		})
		.onConflictDoUpdate({
			target: [toeicSpeakingResponse.sessionId, toeicSpeakingResponse.promptId],
			set: {
				transcript,
				durationMs,
				rubricScores: grade.rubricScores,
				rawScore: grade.rawScore,
				feedbackVi: grade.feedbackVi,
			},
		});

	void recordLearningEvent({
		userId,
		sessionId,
		moduleType: "toeic_speaking",
		contentId: promptId,
		skillIds: ["toeic.part5.vocab", "toeic.part5.verb_form"],
		attemptId: sessionId,
		eventType: "exercise_submitted",
		result:
			grade.rawScore >= prompt.maxScore * 0.7
				? "correct"
				: grade.rawScore > 0
					? "partial"
					: "incorrect",
		score: grade.rawScore / prompt.maxScore,
		durationMs,
		difficulty: prompt.type === "q11_opinion" ? "advanced" : "intermediate",
		errorTags: [],
	});

	return Response.json({
		rawScore: grade.rawScore,
		maxScore: prompt.maxScore,
		rubricScores: grade.rubricScores,
		feedbackVi: grade.feedbackVi,
		transcript,
	});
}
