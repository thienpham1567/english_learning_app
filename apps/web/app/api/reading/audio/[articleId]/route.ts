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

  try {
    // Fetch article from internal API (server-side)
    const baseUrl = request.url.split("/api/reading/audio")[0];
    const articleRes = await fetch(`${baseUrl}/api/reading/article/${articleId}`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!articleRes.ok) {
      console.error(`[Reading Audio] Article fetch failed: ${articleRes.status}`);
      return Response.json({ error: "Article not found" }, { status: 404 });
    }

    const article = await articleRes.json() as {
      title: string;
      paragraphs: string[];
    };

    if (!article.paragraphs || article.paragraphs.length === 0) {
      return Response.json({ error: "Article has no content" }, { status: 400 });
    }

    // Synthesize each paragraph separately then concatenate WAV buffers
    // This avoids hitting the 200-char limit too aggressively on very long text
    const fullText = article.paragraphs.join("\n\n");
    console.log(`[Reading Audio] articleId=${articleId}, voice=${voice}, text=${fullText.length} chars, paragraphs=${article.paragraphs.length}`);

    const startMs = Date.now();

    // Process paragraphs in parallel (up to 5 at a time)
    const BATCH_SIZE = 5;
    const allParts: Buffer[] = [];

    for (let i = 0; i < article.paragraphs.length; i += BATCH_SIZE) {
      const batch = article.paragraphs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((para, bi) => {
          const idx = i + bi;
          console.log(`[Reading Audio]   Paragraph ${idx + 1}/${article.paragraphs.length}: ${para.length} chars`);
          return synthesizeTtsForVoice({
            text: para,
            voice,
            format: "wav",
            speed: 0.9,
          }).then((ab) => Buffer.from(ab));
        }),
      );
      allParts.push(...batchResults);
    }

    const buf = concatWavBuffers(allParts);
    console.log(`[Reading Audio] Done in ${Date.now() - startMs}ms, ${buf.length} bytes`);

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Reading Audio] Error: ${message}`);
    return Response.json({ error: `Audio generation failed: ${message}` }, { status: 502 });
  }
}
