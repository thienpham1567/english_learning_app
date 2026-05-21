import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  synthesizeTtsForVoice,
  VOICE_BY_ROLE,
  type VoiceRole,
} from "@/lib/tts/groq";
import { readTtsCache, writeTtsCache } from "@/lib/tts/cache";
import { routeLogger } from "@/lib/logger";

/**
 * POST /api/read-aloud
 *
 * Converts long-form text to speech via Groq Orpheus TTS.
 * Supports all 6 voice roles (us-m, us-f, uk-m, uk-f, au-m, au-f).
 * Text can be up to 10,000 characters — the existing chunking logic
 * in `synthesizeTtsForVoice` handles splitting at sentence boundaries.
 *
 * Body: { text: string, voice: VoiceRole, speed?: number }
 * Returns: audio/wav binary
 */

const MAX_TEXT_LENGTH = 10_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // lower limit since long text = many Groq calls
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const now = Date.now();
  const userId = session.user.id;
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json(
        { error: "Quá giới hạn. Vui lòng thử lại sau 1 phút." },
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
    return Response.json({ error: "Chưa nhập văn bản" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `Văn bản quá dài (tối đa ${MAX_TEXT_LENGTH.toLocaleString()} ký tự)` },
      { status: 400 },
    );
  }

  const voiceRole = body?.voice as VoiceRole;
  const validRoles: VoiceRole[] = ["us-m", "us-f", "uk-m", "uk-f", "au-m", "au-f"];
  if (!validRoles.includes(voiceRole)) {
    return Response.json({ error: "Voice không hợp lệ" }, { status: 400 });
  }

  const voiceName = VOICE_BY_ROLE[voiceRole];
  const speed = typeof body?.speed === "number" ? Math.max(0.5, Math.min(body.speed, 2.0)) : 1;

  const cacheKey = `read-aloud|${voiceName}|${speed}|${text}`;
  const log = routeLogger("read-aloud", { userId, voice: voiceRole, speed, chars: text.length });

  try {
    // Check cache first
    const cached = await readTtsCache("read-aloud", cacheKey, "wav");
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
    const audio = await synthesizeTtsForVoice({
      text,
      voice: voiceName,
      format: "wav",
      speed,
    });
    log.info({ ttsMs: Date.now() - t0, bytes: audio.byteLength }, "tts.done");

    const buf = Buffer.from(audio);
    await writeTtsCache("read-aloud", cacheKey, buf, "wav");

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
    return Response.json(
      { error: `Lỗi tổng hợp giọng nói: ${message}` },
      { status: 502 },
    );
  }
}
