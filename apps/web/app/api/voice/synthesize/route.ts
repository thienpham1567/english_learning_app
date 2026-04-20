import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseAccent, synthesizeGoogleTts } from "@/lib/tts/google";

/**
 * POST /api/voice/synthesize
 *
 * Converts text to speech via Google Cloud TTS (Neural2 voices).
 * Body: { text: string, speed?: number, accent?: "us" | "uk" | "au" }
 * Requires GOOGLE_TTS_API_KEY.
 *
 * Rate limited to 10 calls per user per minute.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as {
    text?: string;
    speed?: number;
    accent?: string;
  } | null;

  const text = body?.text?.trim();
  if (!text) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }
  if (text.length > 4000) {
    return Response.json({ error: "Text too long (max 4000 chars)" }, { status: 400 });
  }

  const accent = parseAccent(body?.accent);
  const speed = typeof body?.speed === "number" ? body.speed : 1;

  try {
    const audio = await synthesizeGoogleTts({ text, accent, speed });
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[TTS] Google synthesis failed:", err);
    return Response.json({ error: "Speech synthesis failed" }, { status: 502 });
  }
}
