import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseAccent, synthesizeTts, VOICES } from "@/lib/tts/groq";
import { readTtsCache, writeTtsCache } from "@/lib/tts/cache";
import { routeLogger } from "@/lib/logger";

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

  // Key cache by the exact inputs that change audio output.
  const voice = VOICES[accent];
  const cacheKey = `${voice}|${speed}|${text}`;

  const log = routeLogger("voice/synthesize", { userId, accent, speed, chars: text.length });

  try {
    const cached = await readTtsCache("voice-synth", cacheKey, "wav");
    if (cached) {
      log.info({ bytes: cached.length, cache: "hit" }, "audio.served");
      return new Response(new Uint8Array(cached), {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=86400",
          "X-Tts-Cache": "hit",
        },
      });
    }

    log.info("tts.request");
    const t0 = Date.now();
    const audio = await synthesizeTts({ text, accent, speed });
    log.info({ ttsMs: Date.now() - t0, bytes: audio.byteLength }, "tts.done");

    const buf = Buffer.from(audio);
    await writeTtsCache("voice-synth", cacheKey, buf, "wav");

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
        "X-Tts-Cache": "miss",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message }, "tts.failed");
    return Response.json({ error: `Speech synthesis failed: ${message}` }, { status: 502 });
  }
}
