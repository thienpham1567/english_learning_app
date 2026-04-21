import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise, listeningSummaryAttempt } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

// ── Input validation (AC5) ──
const SummaryScoreInputSchema = z.object({
  exerciseId: z.string().uuid(),
  summary: z
    .string()
    .min(1, "Summary cannot be empty")
    .max(2000, "Summary too long"), // server cap, word count checked below
});

// ── Rate limiting (AC5: 10/min/user) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// ── Word count helper ──
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Structured output type ──
type SummaryScoreResult = {
  keyIdeas: string[];
  coverage: Array<{ idea: string; covered: boolean; whereInSummary?: string }>;
  accuracyScore: number;
  coverageScore: number;
  concisenessScore: number;
  overall: number;
  feedback: string;
};

// ── System prompt ──
function buildSummaryScorePrompt(): string {
  return `You are an expert English listening comprehension evaluator.

You will receive:
1. A listening passage (the ground truth)
2. A learner's summary of that passage

Your task:
STEP 1 - Extract 3-6 KEY IDEAS from the passage (short noun phrases or sentences).
STEP 2 - For each key idea, check whether the learner's summary covers it (semantically, not exact match). If covered, note WHERE in the summary.
STEP 3 - Score the summary on three dimensions (each 0-100):
  - accuracyScore: Are the facts stated in the summary correct and not contradicting the passage?
  - coverageScore: What percentage of key ideas are covered?
  - concisenessScore: Is the summary appropriately concise (3-5 sentences, no padding)?
STEP 4 - Compute overall = round((accuracyScore + coverageScore + concisenessScore) / 3).
STEP 5 - Write 1-3 sentences of constructive feedback in English.

Return ONLY valid JSON (no markdown fences) matching this exact shape:
{
  "keyIdeas": ["idea 1", "idea 2", ...],
  "coverage": [
    { "idea": "idea 1", "covered": true, "whereInSummary": "In sentence 2: ..." },
    { "idea": "idea 2", "covered": false }
  ],
  "accuracyScore": 85,
  "coverageScore": 67,
  "concisenessScore": 90,
  "overall": 81,
  "feedback": "Good attempt! You captured the main point but missed..."
}`;
}

/**
 * POST /api/listening/summary-score
 *
 * Accepts { exerciseId, summary }, verifies ownership, scores the summary
 * using structured AI output, and persists the attempt.
 *
 * Rate limit: 10 requests/min/user (AC5)
 * Word guards: < 30 words → 400, > 400 words → 400 (AC5)
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const parsed = SummaryScoreInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { exerciseId, summary } = parsed.data;

    // Word count guard (AC5) — checked before rate limit so invalid requests don't burn quota
    const wc = wordCount(summary);
    if (wc < 30) {
      return Response.json(
        { error: "Summary too short. Please write at least 30 words to get meaningful feedback." },
        { status: 400 },
      );
    }
    if (wc > 400) {
      return Response.json(
        { error: "Summary too long. Please keep it under 400 words (3-5 sentences is ideal)." },
        { status: 400 },
      );
    }

    // Rate limit check (AC5) — only counted against valid, well-formed requests
    if (!checkRateLimit(userId)) {
      return Response.json(
        { error: "Rate limit exceeded. Try again in a minute." },
        { status: 429 },
      );
    }

    // Ownership check — load exercise belonging to this user (AC2)
    const [exercise] = await db
      .select()
      .from(listeningExercise)
      .where(and(eq(listeningExercise.id, exerciseId), eq(listeningExercise.userId, userId)))
      .limit(1);

    if (!exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    // AI scoring — structured output (AC2, AC4)
    const userMessage = `PASSAGE:\n${exercise.passage}\n\nLEARNER'S SUMMARY:\n${summary}`;

    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: buildSummaryScorePrompt() },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2, // Low temp for deterministic key-idea extraction (AC4)
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return Response.json({ error: "AI did not return content" }, { status: 502 });
    }

    let scored: SummaryScoreResult;
    try {
      scored = JSON.parse(rawContent) as SummaryScoreResult;
    } catch {
      console.error("[SummaryScore] Failed to parse AI response:", rawContent);
      return Response.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    // Validate shape
    if (
      !Array.isArray(scored.keyIdeas) ||
      !Array.isArray(scored.coverage) ||
      typeof scored.accuracyScore !== "number" ||
      typeof scored.coverageScore !== "number" ||
      typeof scored.concisenessScore !== "number" ||
      typeof scored.overall !== "number"
    ) {
      console.error("[SummaryScore] AI response missing required fields:", scored);
      return Response.json({ error: "AI response malformed" }, { status: 502 });
    }

    // Clamp scores to 0-100
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const accuracyScore = clamp(scored.accuracyScore);
    const coverageScore = clamp(scored.coverageScore);
    const concisenessScore = clamp(scored.concisenessScore);
    const overall = clamp(scored.overall);

    // Persist attempt (AC6)
    const [attempt] = await db
      .insert(listeningSummaryAttempt)
      .values({
        userId,
        exerciseId,
        summary,
        overall,
        accuracyScore,
        coverageScore,
        concisenessScore,
        keyIdeasJson: scored.keyIdeas,
        coverageJson: scored.coverage,
      })
      .returning();

    return Response.json({
      attemptId: attempt.id,
      overall,
      accuracyScore,
      coverageScore,
      concisenessScore,
      keyIdeas: scored.keyIdeas,
      coverage: scored.coverage,
      feedback: scored.feedback ?? "",
      passage: exercise.passage, // Revealed after submission (AC3)
    });
  } catch (err) {
    console.error("[SummaryScore] Error:", err);
    return Response.json({ error: "Failed to score summary" }, { status: 500 });
  }
}
