import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";
import { parseAccent, synthesizeTts } from "@/lib/tts/groq";

/**
 * GET /api/listening/audio/[id]?accent=us|uk|au
 *
 * Streams Groq Orpheus TTS audio for a listening passage.
 * Long-lived Cache-Control — passage is immutable per (id, accent).
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
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

  const { id } = await params;
  const accent = parseAccent(new URL(request.url).searchParams.get("accent"));

  try {
    const [exercise] = await db
      .select({ passage: listeningExercise.passage, userId: listeningExercise.userId })
      .from(listeningExercise)
      .where(eq(listeningExercise.id, id))
      .limit(1);

    if (!exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }
    if (exercise.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const audio = await synthesizeTts({
      text: exercise.passage,
      accent,
      speed: 0.9,
    });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    console.error("[Listening Audio] Error:", err);
    return Response.json({ error: "Audio generation failed" }, { status: 502 });
  }
}
