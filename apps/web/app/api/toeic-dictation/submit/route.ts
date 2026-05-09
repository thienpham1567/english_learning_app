import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicDictationItem } from "@repo/database";
import { eq } from "drizzle-orm";
import { recordLearningEvent } from "@repo/modules";

const BodySchema = z.object({
	exerciseId: z.string().uuid(),
	userTranscript: z.string().max(2000),
	durationMs: z.number().int().min(0),
});

/** Normalize text for word-level comparison: lowercase, strip punctuation. */
function tokens(s: string): string[] {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9'\s]/g, " ")
		.split(/\s+/)
		.filter(Boolean);
}

/**
 * Word-level diff (longest common subsequence). Returns aligned tokens.
 */
function diff(refTokens: string[], userTokens: string[]) {
	const m = refTokens.length;
	const n = userTokens.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 0; i < m; i++) {
		for (let j = 0; j < n; j++) {
			dp[i + 1][j + 1] =
				refTokens[i] === userTokens[j]
					? dp[i][j] + 1
					: Math.max(dp[i][j + 1], dp[i + 1][j]);
		}
	}
	// Reconstruct
	type DiffEntry = { type: "match" | "missing" | "extra"; ref?: string; user?: string };
	const out: DiffEntry[] = [];
	let i = m;
	let j = n;
	while (i > 0 && j > 0) {
		if (refTokens[i - 1] === userTokens[j - 1]) {
			out.unshift({ type: "match", ref: refTokens[i - 1], user: userTokens[j - 1] });
			i--;
			j--;
		} else if (dp[i - 1][j] >= dp[i][j - 1]) {
			out.unshift({ type: "missing", ref: refTokens[i - 1] });
			i--;
		} else {
			out.unshift({ type: "extra", user: userTokens[j - 1] });
			j--;
		}
	}
	while (i > 0) {
		out.unshift({ type: "missing", ref: refTokens[i - 1] });
		i--;
	}
	while (j > 0) {
		out.unshift({ type: "extra", user: userTokens[j - 1] });
		j--;
	}
	const matched = out.filter((e) => e.type === "match").length;
	const total = refTokens.length;
	const score = total === 0 ? 0 : Math.round((matched / total) * 100);
	return { entries: out, matched, total, score };
}

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) {
		return Response.json({ error: "Invalid body" }, { status: 400 });
	}
	const { exerciseId, userTranscript, durationMs } = parsed.data;
	const userId = session.user.id;

	const [row] = await db
		.select()
		.from(toeicDictationItem)
		.where(eq(toeicDictationItem.id, exerciseId))
		.limit(1);
	if (!row) return Response.json({ error: "Not found" }, { status: 404 });

	const refT = tokens(row.text);
	const userT = tokens(userTranscript);
	const result = diff(refT, userT);

	// Emit learning event
	const eventResult = result.score >= 90 ? "correct" : result.score >= 50 ? "partial" : "incorrect";
	void recordLearningEvent({
		userId,
		sessionId: `dictation:${exerciseId}`,
		moduleType: "toeic_dictation",
		contentId: exerciseId,
		skillIds: ["toeic.part3.detail", "toeic.part4.detail", "toeic.part3.gist", "toeic.part4.gist"],
		attemptId: `dictation-${userId}-${exerciseId}-${Date.now()}`,
		eventType: "exercise_submitted",
		result: eventResult,
		score: result.score / 100,
		durationMs,
		difficulty: row.level === "beginner" ? "elementary" : row.level === "advanced" ? "advanced" : "intermediate",
		errorTags: [],
	});

	return Response.json({
		score: result.score,
		matched: result.matched,
		total: result.total,
		diff: result.entries,
		transcript: row.text,
		vocabHints: row.vocabHints,
	});
}
