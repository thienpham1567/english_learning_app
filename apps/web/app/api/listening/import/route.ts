import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningImport } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import ytdl from "@distube/ytdl-core";

// ── Constants ──
const IMPORT_CACHE_DIR = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".cache"),
  "listening-imports",
);
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — Whisper limit
const MAX_DURATION_SEC = 600; // 10 minutes default cap

// ── Host allowlist (AC1) ──
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  // Direct audio hosts
  "podcasts.google.com",
  "anchor.fm",
  "open.spotify.com", // Spotify won't work for download but user may try
  "soundcloud.com",
]);

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    // Allow direct audio file URLs (any host, mp3/m4a/wav)
    if (/\.(mp3|m4a|wav|ogg|webm)$/i.test(url.pathname)) return true;
    // Check against host allowlist
    const host = url.hostname.replace(/^www\./, "");
    return ALLOWED_HOSTS.has(host) || ALLOWED_HOSTS.has(`www.${host}`);
  } catch {
    return false;
  }
}

function isYouTubeUrl(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname;
    return /youtube\.com|youtu\.be/i.test(host);
  } catch {
    return false;
  }
}

// ── Input schema ──
const ImportInputSchema = z.object({
  url: z.string().url().max(2048),
  maxDurationSec: z.number().int().min(30).max(MAX_DURATION_SEC).optional().default(MAX_DURATION_SEC),
});

// ── Rate limiting (3/min/user — YouTube downloads are expensive) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── YouTube audio download via @distube/ytdl-core (pure JS, works on Vercel) ──
async function downloadYouTubeAudio(url: string, outPath: string, maxDurationSec: number): Promise<{ durationSec: number }> {
  // Get video info first to check duration
  const info = await ytdl.getInfo(url);
  const durationSec = parseInt(info.videoDetails.lengthSeconds, 10);

  if (durationSec > maxDurationSec) {
    throw new Error(`Video exceeds ${Math.floor(maxDurationSec / 60)} minute limit (${Math.round(durationSec / 60)} min).`);
  }

  if (!info.videoDetails.isLiveContent === false && info.videoDetails.isLiveContent) {
    throw new Error("Live streams are not supported.");
  }

  // Download audio-only stream
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "lowestaudio", // smaller file = faster upload to Whisper
  });

  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of stream) {
    totalSize += chunk.length;
    if (totalSize > MAX_FILE_SIZE) {
      stream.destroy();
      throw new Error("Audio file too large (exceeds 25MB).");
    }
    chunks.push(chunk);
  }

  await fs.writeFile(outPath, Buffer.concat(chunks));

  return { durationSec };
}

// ── Direct audio download (AC1) ──
async function downloadDirectAudio(url: string, outPath: string): Promise<{ durationSec: number }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);

  const contentLength = parseInt(response.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_FILE_SIZE) {
    throw new Error(`File too large (${Math.round(contentLength / 1024 / 1024)}MB). Maximum is 25MB.`);
  }

  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum is 25MB.`);
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buf);

  return { durationSec: 0 }; // duration will come from Whisper response
}

// ── Whisper transcription (AC2) ──
async function transcribeAudio(filePath: string): Promise<{
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  duration: number;
}> {
  const fileBuffer = await fs.readFile(filePath);
  const file = new File([fileBuffer], path.basename(filePath), { type: "audio/mpeg" });

  const response = await openAiClient.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "en",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // The response with verbose_json includes segments
  const result = response as unknown as {
    text: string;
    segments?: Array<{ start: number; end: number; text: string }>;
    duration?: number;
  };

  return {
    text: result.text ?? "",
    segments: (result.segments ?? []).map((s) => ({
      start: Math.round(s.start * 100) / 100,
      end: Math.round(s.end * 100) / 100,
      text: s.text.trim(),
    })),
    duration: result.duration ?? 0,
  };
}

// ── Analysis call: title, vocab, quiz (AC3) ──
type AnalysisResult = {
  title: string;
  summary: string;
  keyVocab: Array<{ term: string; partOfSpeech: string; meaning: string; example: string }>;
  comprehensionQuestions: Array<{ question: string; options: string[]; correctIndex: number }>;
};

async function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
  const systemPrompt = `You are an English language learning assistant analyzing a listening passage transcript.

Extract the following from the transcript:
1. A concise title (max 60 characters)
2. A 1-2 sentence summary
3. 5-8 key vocabulary items at B2+ level: { term, partOfSpeech, meaning (in English), example (from transcript or similar context) }
4. 5 comprehension questions: { question, options (4 choices), correctIndex (0-3) }

Focus vocabulary on B2/C1 level words that a learner would benefit from. Skip common words.

Return ONLY valid JSON (no markdown fences):
{
  "title": "...",
  "summary": "...",
  "keyVocab": [{ "term": "...", "partOfSpeech": "noun", "meaning": "...", "example": "..." }],
  "comprehensionQuestions": [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }]
}`;

  const completion = await openAiClient.chat.completions.create({
    model: openAiConfig.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `TRANSCRIPT:\n${transcript.slice(0, 8000)}` },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI analysis returned no content");

  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    throw new Error("AI analysis returned invalid JSON");
  }
}

/**
 * POST /api/listening/import
 *
 * Imports a YouTube or direct audio URL:
 * 1. Downloads audio (yt-dlp for YouTube, fetch for direct)
 * 2. Transcribes via Whisper
 * 3. Extracts vocab + quiz via GPT
 * 4. Persists everything to listeningImport
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const parsed = ImportInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { url, maxDurationSec } = parsed.data;

    // URL allowlist check (AC1)
    if (!isAllowedUrl(url)) {
      return Response.json(
        { error: "URL not supported. Accepted: YouTube, direct audio links (.mp3, .m4a, .wav)." },
        { status: 400 },
      );
    }

    // Rate limit (after validation)
    if (!checkRateLimit(userId)) {
      return Response.json(
        { error: "Rate limit exceeded. Max 3 imports per minute." },
        { status: 429 },
      );
    }

    // Step 1: Download audio (AC1)
    const audioKey = randomUUID();
    const audioPath = path.join(IMPORT_CACHE_DIR, `${audioKey}.mp3`);
    await fs.mkdir(IMPORT_CACHE_DIR, { recursive: true });

    let durationSec: number;

    if (isYouTubeUrl(url)) {
      const result = await downloadYouTubeAudio(url, audioPath, maxDurationSec);
      durationSec = result.durationSec;
    } else {
      const result = await downloadDirectAudio(url, audioPath);
      durationSec = result.durationSec;
    }

    // Verify file exists and check size
    const stat = await fs.stat(audioPath);
    if (stat.size > MAX_FILE_SIZE) {
      await fs.unlink(audioPath).catch(() => {});
      return Response.json({ error: "Downloaded audio exceeds 25MB limit." }, { status: 400 });
    }

    // Step 2: Transcribe via Whisper (AC2)
    const transcription = await transcribeAudio(audioPath);
    if (!transcription.text.trim()) {
      await fs.unlink(audioPath).catch(() => {});
      return Response.json({ error: "Could not transcribe audio — no speech detected." }, { status: 422 });
    }

    if (transcription.duration > 0) {
      durationSec = Math.round(transcription.duration);
    }

    // Step 3: Analyze transcript for vocab + quiz (AC3)
    const analysis = await analyzeTranscript(transcription.text);

    // Step 4: Persist (AC4)
    const [importRow] = await db
      .insert(listeningImport)
      .values({
        userId,
        sourceUrl: url,
        title: analysis.title || "Imported Audio",
        durationSec,
        transcriptJson: transcription.segments,
        keyVocabJson: analysis.keyVocab ?? [],
        quizJson: analysis.comprehensionQuestions ?? [],
        audioKey,
      })
      .returning();

    return Response.json({
      id: importRow.id,
      title: importRow.title,
      durationSec,
      summary: analysis.summary,
      segmentCount: transcription.segments.length,
      vocabCount: (analysis.keyVocab ?? []).length,
      questionCount: (analysis.comprehensionQuestions ?? []).length,
    });
  } catch (err) {
    console.error("[ListeningImport] Error:", err);
    const msg = (err as Error)?.message ?? "Failed to import audio";
    return Response.json({ error: msg }, { status: 500 });
  }
}
