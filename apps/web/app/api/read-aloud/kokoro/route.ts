import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { readTtsCache, writeTtsCache } from "@/lib/tts/cache";
import { isKokoroAvailable, synthesizeKokoroTts } from "@/lib/tts/kokoro";

/**
 * POST /api/read-aloud/kokoro
 *
 * Converts text to speech via Kokoro TTS (self-hosted on HuggingFace Spaces).
 * Accepts Kokoro's native voice IDs (af_heart, am_adam, bf_emma, etc.).
 *
 * Body: { text: string, voice: string, speed?: number }
 * Returns: audio/wav binary
 */

const MAX_TEXT_LENGTH = 10_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // higher limit since Kokoro is self-hosted
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isKokoroAvailable()) {
    return Response.json(
      { error: "Kokoro TTS is not configured (KOKORO_TTS_URL not set)" },
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
        { error: "Rate limit exceeded. Please try again later." },
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

  const voice = body?.voice || "af_heart";
  const speed = typeof body?.speed === "number" ? Math.max(0.5, Math.min(body.speed, 2.0)) : 1;

  const cacheKey = `kokoro|${voice}|${speed}|${text}`;
  const log = routeLogger("read-aloud-kokoro", { userId, voice, speed, chars: text.length });

  try {
    // Check cache first
    const cached = await readTtsCache("read-aloud-kokoro", cacheKey, "wav");
    if (cached) {
      log.info({ bytes: cached.length, cache: "hit" }, "audio.served");
      return new Response(new Uint8Array(cached), {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=86400",
          "X-Tts-Cache": "hit",
          "X-Tts-Provider": "kokoro",
        },
      });
    }

    log.info("tts.request");
    const t0 = Date.now();
    const audio = await synthesizeKokoroTts({
      text,
      voice,
      format: "wav",
      speed,
    });
    log.info({ ttsMs: Date.now() - t0, bytes: audio.byteLength }, "tts.done");

    const buf = Buffer.from(audio);
    await writeTtsCache("read-aloud-kokoro", cacheKey, buf, "wav");

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
        "X-Tts-Cache": "miss",
        "X-Tts-Provider": "kokoro",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message }, "tts.failed");
    return Response.json({ error: `Kokoro TTS failed: ${message}` }, { status: 502 });
  }
}
