import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseAccent, synthesizeTts } from "@/lib/tts/groq";

/**
 * POST /api/voice/synthesize
 *
 * Converts text to speech via Groq Orpheus TTS (canopylabs/orpheus-v1-english).
 * Body: { text: string, speed?: number, accent?: "us" | "uk" | "au" }
 * Requires GROQ_API_KEY.
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
  if (text.length > 200) {
    return Response.json({ error: "Text too long (max 200 chars)" }, { status: 400 });
  }

  const accent = parseAccent(body?.accent);
  const speed = typeof body?.speed === "number" ? body.speed : 1;

  try {
    console.log(`[Voice Synth] Request: accent=${accent}, speed=${speed}, text="${text.slice(0, 50)}..."`);
    const startMs = Date.now();
    const audio = await synthesizeTts({ text, accent, speed });
    console.log(`[Voice Synth] OK in ${Date.now() - startMs}ms, ${audio.byteLength} bytes`);
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Voice Synth] Groq synthesis failed: ${message}`);
    return Response.json({ error: `Speech synthesis failed: ${message}` }, { status: 502 });
  }
}
