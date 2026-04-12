import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listeningExercise } from "@/lib/db/schema";

/**
 * GET /api/listening/audio/[id]
 *
 * Generates and streams TTS audio for a listening exercise.
 * Uses OpenAI TTS API (tts-1 model, nova voice) via OPENAI_DIRECT_API_KEY.
 * Caches with long-lived Cache-Control since passage content is immutable.
 * Rate limited to 5 calls per user per minute.
 */

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
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
  const apiKey = process.env.OPENAI_DIRECT_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_DIRECT_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Look up the exercise
    const [exercise] = await db
      .select({ passage: listeningExercise.passage, userId: listeningExercise.userId })
      .from(listeningExercise)
      .where(eq(listeningExercise.id, id))
      .limit(1);

    if (!exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Verify ownership
    if (exercise.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate TTS audio
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",
        input: exercise.passage,
        speed: 0.9, // Slightly slower for listening practice
        response_format: "mp3",
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("[Listening Audio] TTS error:", ttsResponse.status, errorText);
      return Response.json({ error: "Audio generation failed" }, { status: 502 });
    }

    // Stream the audio back with aggressive caching (passage is immutable)
    return new Response(ttsResponse.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800", // cache 7 days
      },
    });
  } catch (err) {
    console.error("[Listening Audio] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
