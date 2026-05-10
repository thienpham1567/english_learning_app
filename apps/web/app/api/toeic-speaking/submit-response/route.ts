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
import {
	computeFluency,
	computeAlignment,
	type PronunciationMetrics,
} from "@/lib/toeic/pronunciation-analysis";
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

	// Audio size limit: 10MB max (real recordings are <2MB; cap blocks DoS)
	const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
	if (audioBlob.size > MAX_AUDIO_BYTES) {
		return Response.json({ error: "Audio file too large (max 10MB)" }, { status: 413 });
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

	// Persist audio outside public/ — served via authenticated /api/toeic-speaking/audio/[id]
	const audioId = crypto.randomBytes(8).toString("hex");
	const audioDir = join(process.cwd(), "uploads/speaking");
	await mkdir(audioDir, { recursive: true });
	const audioPath = join(audioDir, `${userId.slice(0, 8)}_${audioId}.webm`);
	const arrayBuffer = await audioBlob.arrayBuffer();
	await writeFile(audioPath, Buffer.from(arrayBuffer));

	// Transcribe + analyze + grade
	let transcript = "";
	let metrics: PronunciationMetrics | undefined;
	let grade: { rawScore: number; rubricScores: Record<string, number>; feedbackVi: string };
	try {
		const transcribed = await transcribeAudio(audioPath, "audio/webm");
		transcript = transcribed.text;

		// Always compute fluency metrics
		metrics = computeFluency(transcribed.words, durationMs);

		// Q1-2: also compute forced alignment vs the read-aloud text
		if (prompt.type === "q1_2_read_aloud" && prompt.textToRead) {
			metrics.alignment = computeAlignment(prompt.textToRead, transcribed.words);
		}

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
			metrics,
		});
	} catch (err) {
		grade = {
			rawScore: 0,
			rubricScores: {},
			feedbackVi: `Transcribe/grade failed: ${err instanceof Error ? err.message : "unknown"}`,
		};
	}

	const [inserted] = await db
		.insert(toeicSpeakingResponse)
		.values({
			sessionId,
			promptId,
			// Store filesystem path; result page fetches via /api/toeic-speaking/audio/[id]
			audioPath: audioPath.replace(join(process.cwd(), ""), "").replace(/^\//, ""),
			transcript,
			durationMs,
			rubricScores: { ...grade.rubricScores, ...(metrics ? { pronunciation: metrics } : {}) },
			rawScore: grade.rawScore,
			feedbackVi: grade.feedbackVi,
		})
		.onConflictDoUpdate({
			target: [toeicSpeakingResponse.sessionId, toeicSpeakingResponse.promptId],
			set: {
				transcript,
				durationMs,
				rubricScores: { ...grade.rubricScores, ...(metrics ? { pronunciation: metrics } : {}) },
				rawScore: grade.rawScore,
				feedbackVi: grade.feedbackVi,
			},
		})
		.returning();

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
		pronunciation: metrics ?? null,
	});
}
