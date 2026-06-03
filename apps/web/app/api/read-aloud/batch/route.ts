import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { readTtsCache, writeTtsCache } from "@/lib/tts/cache";
import { synthesizeTtsForVoice, VOICE_BY_ROLE, VOICE_ROLES, type VoiceRole } from "@/lib/tts/groq";

/**
 * POST /api/read-aloud/batch
 *
 * Batch TTS endpoint — accepts multiple lines in a single request and
 * processes them sequentially through the Groq rate limiter.
 *
 * This prevents the client from firing N concurrent requests that each
 * individually bypass the rate limiter and cause 429 errors.
 *
 * Body: { lines: { text: string, voice: VoiceRole }[], speed?: number }
 * Returns: { segments: string[] } — base64-encoded WAV for each line
 */

const MAX_LINES = 30;
const MAX_TEXT_PER_LINE = 2_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3; // batch requests per minute (each batch = many lines)
const RATE_LIMIT_WINDOW_MS = 60_000;

interface BatchLine {
  text: string;
  voice: string;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — per batch, not per line
  const now = Date.now();
  const userId = session.user.id;
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json(
        { error: "Quá giới hạn batch. Vui lòng thử lại sau 1 phút." },
        { status: 429 },
      );
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    lines?: BatchLine[];
    speed?: number;
  } | null;

  if (!body?.lines || !Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ error: "Chưa có dòng nào để TTS" }, { status: 400 });
  }
  if (body.lines.length > MAX_LINES) {
    return Response.json({ error: `Tối đa ${MAX_LINES} dòng mỗi batch` }, { status: 400 });
  }


  const speed = typeof body.speed === "number" ? Math.max(0.5, Math.min(body.speed, 2.0)) : 1;
  const log = routeLogger("read-aloud-batch", { userId, lineCount: body.lines.length, speed });

  // Validate all lines upfront
  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i];
    if (!line.text?.trim()) {
      return Response.json({ error: `Dòng ${i + 1} rỗng` }, { status: 400 });
    }
    if (line.text.length > MAX_TEXT_PER_LINE) {
      return Response.json(
        { error: `Dòng ${i + 1} quá dài (tối đa ${MAX_TEXT_PER_LINE} ký tự)` },
        { status: 400 },
      );
    }
    if (!(VOICE_ROLES as readonly string[]).includes(line.voice)) {
      return Response.json({ error: `Invalid voice at line ${i + 1}` }, { status: 400 });
    }
  }

  log.info("batch.start");
  const t0 = Date.now();

  try {
    const segments: string[] = [];
    let cacheHits = 0;

    for (let i = 0; i < body.lines.length; i++) {
      const line = body.lines[i];
      const text = line.text.trim();
      const voiceName = VOICE_BY_ROLE[line.voice as VoiceRole];
      const cacheKey = `read-aloud|${voiceName}|${speed}|${text}`;

      // Check disk cache first
      const cached = await readTtsCache("read-aloud", cacheKey, "wav");
      if (cached) {
        segments.push(Buffer.from(cached).toString("base64"));
        cacheHits++;
        continue;
      }

      // TTS — processed sequentially through the rate limiter
      const audio = await synthesizeTtsForVoice({
        text,
        voice: voiceName,
        format: "wav",
        speed,
      });

      const buf = Buffer.from(audio);
      await writeTtsCache("read-aloud", cacheKey, buf, "wav");
      segments.push(buf.toString("base64"));
    }

    const elapsed = Date.now() - t0;
    log.info(
      { totalMs: elapsed, cacheHits, ttsCalls: body.lines.length - cacheHits },
      "batch.done",
    );

    return Response.json({ segments });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.error({ err: errMsg }, "batch.failed");
    return Response.json({ error: `Lỗi tổng hợp giọng nói: ${errMsg}` }, { status: 502 });
  }
}
