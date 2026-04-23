import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import {
  synthesizeTtsForVoice,
  parseAccent,
  VOICES,
  VOICE_BY_ROLE,
  type VoiceRole,
} from "@/lib/tts/groq";
import { fetchGuardianArticle } from "@/lib/reading/utils";
import { readTtsCache, writeTtsCache } from "@/lib/tts/cache";

/**
 * GET /api/reading/audio/[articleId]?accent=us|uk|au
 *
 * Streams TTS audio for a reading article.
 * Fetches the article content server-side, concatenates all paragraphs,
 * and synthesises speech via Groq Orpheus (WAV).
 *
 * The article text can be long (500-1500+ words) which means the chunking
 * logic inside `synthesizeTtsForVoice` handles splitting automatically.
 *
 * Rate limited to 3 calls per user per minute (TTS is expensive).
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Concatenate multiple WAV buffers by stripping headers from all but the first. */
function concatWavBuffers(parts: Buffer[]): Buffer {
  if (parts.length === 0) return Buffer.alloc(0);
  if (parts.length === 1) return parts[0];

  const WAV_HEADER_SIZE = 44;
  const pcmParts = parts.map((p, i) => (i === 0 ? p : p.subarray(WAV_HEADER_SIZE)));
  const result = Buffer.concat(pcmParts);

  result.writeUInt32LE(result.length - 8, 4);
  result.writeUInt32LE(result.length - WAV_HEADER_SIZE, 40);

  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
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
      return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const { articleId } = await params;
  const url = new URL(request.url);
  const voiceParam = url.searchParams.get("voice");
  const accent = parseAccent(url.searchParams.get("accent"));

  // Resolve voice: explicit voice name > accent default
  const allVoiceNames = Object.values(VOICE_BY_ROLE);
  const voice = (voiceParam && allVoiceNames.includes(voiceParam))
    ? voiceParam
    : VOICES[accent];

  const cacheKey = `${articleId}|${voice}`;

  try {
    // Short-circuit: if we already have cached audio for this (article, voice),
    // return it without fetching the article or calling Groq.
    const cachedBuf = await readTtsCache("reading", cacheKey, "wav");
    if (cachedBuf) {
      console.log(`[Reading Audio] Cache HIT: articleId=${articleId}, voice=${voice}, ${cachedBuf.length} bytes`);
      return new Response(new Uint8Array(cachedBuf), {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=604800",
          "X-Tts-Cache": "hit",
        },
      });
    }

    // Fetch article using shared util instead of internal fetch
    // This avoids Vercel deployment issues with nested relative API calls
    const article = await fetchGuardianArticle(decodeURIComponent(articleId));

    if (!article.paragraphs || article.paragraphs.length === 0) {
      return Response.json({ error: "Article has no content" }, { status: 400 });
    }

    // Cap text we send to TTS. Groq on_demand is 10 RPM — a 393-paragraph
    // live-blog would take ~40 minutes and time out the request. Take the
    // first N paragraphs up to a character budget suitable for a short listen.
    const MAX_PARAGRAPHS = 30;
    const MAX_CHARS = 6000;
    const picked: string[] = [];
    let charBudget = 0;
    for (const p of article.paragraphs) {
      if (picked.length >= MAX_PARAGRAPHS) break;
      if (charBudget + p.length > MAX_CHARS) break;
      picked.push(p);
      charBudget += p.length;
    }
    const paragraphs = picked.length > 0 ? picked : [article.paragraphs[0].slice(0, MAX_CHARS)];
    const truncated = paragraphs.length < article.paragraphs.length;
    console.log(`[Reading Audio] articleId=${articleId}, voice=${voice}, text=${charBudget} chars, paragraphs=${paragraphs.length}/${article.paragraphs.length}${truncated ? " (truncated)" : ""}`);

    const startMs = Date.now();

    // Synthesize all paragraphs — concurrency + 429 retry are handled inside
    // synthesizeTtsForVoice's global TTS queue in lib/tts/groq.ts.
    const allParts: Buffer[] = [];
    const results = await Promise.all(
      paragraphs.map((para: string, idx: number) => {
        console.log(`[Reading Audio]   Paragraph ${idx + 1}/${paragraphs.length}: ${para.length} chars`);
        return synthesizeTtsForVoice({
          text: para,
          voice,
          format: "wav",
          speed: 0.9,
        }).then((ab) => Buffer.from(ab));
      }),
    );
    allParts.push(...results);

    const buf = concatWavBuffers(allParts);
    console.log(`[Reading Audio] Done in ${Date.now() - startMs}ms, ${buf.length} bytes`);

    await writeTtsCache("reading", cacheKey, buf, "wav");

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=604800",
        "X-Tts-Cache": "miss",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Reading Audio] Error: ${message}`);
    return Response.json({ error: `Audio generation failed: ${message}` }, { status: 502 });
  }
}
