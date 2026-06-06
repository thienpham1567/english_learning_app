import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { isElevenLabsAvailable, synthesizeElevenLabsTts } from "@/lib/tts/elevenlabs";

/**
 * POST /api/read-aloud/elevenlabs
 *
 * Text-to-Speech via ElevenLabs API.
 * Body: { text: string, voice: string (voiceId), speed?: number }
 * Returns: audio/mpeg binary
 */

const MAX_TEXT_LENGTH = 5_000; // ElevenLabs free tier — keep conservative

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3; // Strict — protect free quota
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isElevenLabsAvailable()) {
    return Response.json(
      { error: "ElevenLabs is not configured. Set ELEVENLABS_API_KEY in .env" },
      { status: 503 },
    );
  }

  // Rate limit
  const now = Date.now();
  const userId = session.user.id;
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json(
        { error: "Rate limit reached. Please wait a moment." },
        { status: 429 },
      );
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    text?: string;
    voice?: string;
    speed?: number;
  } | null;

  const text = body?.text?.trim();
  if (!text) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `Text too long (max ${MAX_TEXT_LENGTH.toLocaleString()} chars)` },
      { status: 400 },
    );
  }

  const voiceId = body?.voice;
  if (!voiceId) {
    return Response.json({ error: "No voice ID provided" }, { status: 400 });
  }

  const speed = typeof body?.speed === "number" ? Math.max(0.5, Math.min(body.speed, 2.0)) : 1;
  const log = routeLogger("read-aloud/elevenlabs", { userId, voiceId, speed, chars: text.length });

  try {
    log.info("tts.request");
    const t0 = Date.now();
    const audio = await synthesizeElevenLabsTts({ text, voiceId, speed });
    log.info({ ttsMs: Date.now() - t0, bytes: audio.byteLength }, "tts.done");

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message }, "tts.failed");
    return Response.json({ error: `ElevenLabs TTS error: ${message}` }, { status: 502 });
  }
}
