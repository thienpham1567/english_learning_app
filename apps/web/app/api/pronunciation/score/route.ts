import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { pronunciationAttempt } from "@repo/database";
import { alignAndScore, tokenize, transcriptOverlap } from "@/lib/pronunciation/align";
import { parseAccent } from "@/lib/tts/groq";

/**
 * POST /api/pronunciation/score
 *
 * Deterministic phoneme-level scoring. Expects the client to have already
 * transcribed the audio via /api/voice/transcribe; this endpoint aligns the
 * spoken text against the reference using CMUdict phonemes.
 *
 * Body: { referenceText: string, spokenText: string, accent?: "us"|"uk"|"au" }
 * Runs in parallel with /api/pronunciation/evaluate (LLM feedback).
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();

  // Evict expired entries to prevent memory leak (Finding 2)
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }

  const userId = session.user.id;
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    referenceText?: string;
    spokenText?: string;
    accent?: string;
  } | null;

  const referenceText = body?.referenceText?.trim();
  const spokenText = body?.spokenText?.trim();
  if (!referenceText || !spokenText) {
    return Response.json({ error: "referenceText and spokenText are required" }, { status: 400 });
  }
  if (referenceText.length > 500 || spokenText.length > 500) {
    return Response.json({ error: "Text too long (max 500 chars)" }, { status: 400 });
  }

  // AC5: no-speech — tokenized input has no recognizable words
  if (tokenize(referenceText).length === 0 || tokenize(spokenText).length === 0) {
    return Response.json(
      { error: "no-speech", message: "No recognizable words found in the input." },
      { status: 422 },
    );
  }

  const overlap = transcriptOverlap(referenceText, spokenText);
  if (overlap < 0.3) {
    return Response.json(
      {
        error: "off-topic",
        message: "Spoken text doesn't match the reference closely enough. Please read the prompt again.",
        overlap,
      },
      { status: 422 },
    );
  }

  const result = alignAndScore(referenceText, spokenText);
  const accent = parseAccent(body?.accent);

  try {
    await db.insert(pronunciationAttempt).values({
      userId,
      referenceText,
      transcript: spokenText,
      overall: result.overall,
      accent,
    });
  } catch (err) {
    console.error("[pronunciation/score] Persist failed:", err);
    // Non-fatal — return the score even if persistence failed.
  }

  return Response.json({
    overall: result.overall,
    transcript: spokenText,
    wordScores: result.wordScores,
  });
}
