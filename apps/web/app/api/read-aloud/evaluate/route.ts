import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { transcribeSpeakingAudio } from "@/lib/speaking/transcribe";

const log = routeLogger("read-aloud/evaluate");

const MAX_DURATION_MS = 30_000;
const OPENAI_TIMEOUT_MS = 25_000;
const MIN_WORDS = 2;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function clampScore(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function coerceString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

interface WordScore {
  word: string;
  score: "good" | "fair" | "poor";
  tip?: string;
}

/**
 * POST /api/read-aloud/evaluate
 *
 * Evaluate a shadowing recording against a reference sentence.
 * Pipeline: transcribe user audio → LLM compares transcript vs reference → return scores.
 *
 * Body (FormData): { audio: File, referenceText: string, durationMs: string }
 * Returns: { overall, pronunciation, intonation, fluency, stress, transcript, wordScores, summary }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = Date.now();

  // Rate limit
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Quá giới hạn. Vui lòng thử lại sau." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!(audioFile instanceof File)) {
    return Response.json({ error: "No audio file" }, { status: 400 });
  }

  const referenceText = coerceString(formData.get("referenceText")).trim();
  if (!referenceText) {
    return Response.json({ error: "referenceText is required" }, { status: 400 });
  }

  const durationRaw = formData.get("durationMs");
  const durationMs = typeof durationRaw === "string" ? Number(durationRaw) : NaN;
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) {
    return Response.json({ error: `Invalid durationMs (1..${MAX_DURATION_MS})` }, { status: 400 });
  }

  // Step 1: Transcribe user audio
  const transcription = await transcribeSpeakingAudio(audioFile, durationMs);
  if (!transcription.ok) {
    return Response.json({ error: transcription.error }, { status: transcription.status });
  }
  const transcript = transcription.text.trim();

  if (!transcript || transcript.split(/\s+/).filter(Boolean).length < MIN_WORDS) {
    return Response.json({
      error: "no-speech",
      message: "Không nhận dạng được giọng nói. Hãy nói rõ hơn và thử lại.",
    }, { status: 422 });
  }

  // Step 2: LLM evaluation
  const refWords = referenceText.split(/\s+/).filter(Boolean);
  const prompt = `You are an English pronunciation coach evaluating a SHADOWING exercise.

The student listened to a native speaker read a sentence, then repeated it. Compare their speech to the reference.

## Reference Text (what they should have said):
"${referenceText}"

## Student's Speech (transcribed from audio):
"${transcript}"

## Recording Duration: ${Math.round(durationMs / 1000)}s

## Evaluation Criteria:
1. **Pronunciation** (0-100): How closely each word was pronounced to native standard
2. **Intonation** (0-100): Rising/falling pitch patterns, question vs statement patterns
3. **Fluency** (0-100): Smoothness, natural pauses vs hesitations, filler words
4. **Stress** (0-100): Word stress on correct syllables, sentence stress on content words

## Return ONLY valid JSON:
{
  "overall": 0-100,
  "pronunciation": 0-100,
  "intonation": 0-100,
  "fluency": 0-100,
  "stress": 0-100,
  "transcript": "${transcript}",
  "wordScores": [
    ${refWords.slice(0, 15).map((w) => `{ "word": "${w}", "score": "good|fair|poor", "tip": "null or Vietnamese tip" }`).join(",\n    ")}
  ],
  "summary": "2-3 sentence feedback in Vietnamese. Be encouraging but specific about what to improve."
}

Score guide: 85-100=excellent native-like, 70-84=good comprehensible, 50-69=needs practice, 0-49=significant issues.
Be fair — if the transcription closely matches the reference, give high scores. Focus on what the student can actually improve.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openAiClient.chat.completions.create(
      {
        model: openAiConfig.chatModel,
        messages: [
          { role: "system", content: "You are an English pronunciation coach. Return only valid JSON. Be encouraging but honest." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      log.error({ preview: cleaned.slice(0, 120) }, "evaluate.json.parse.failed");
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    // Sanitize word scores
    const rawWordScores = Array.isArray(parsed.wordScores) ? parsed.wordScores : [];
    const wordScores: WordScore[] = rawWordScores
      .filter((w): w is Record<string, unknown> => typeof w === "object" && w !== null)
      .map((w) => ({
        word: String(w.word ?? ""),
        score: (["good", "fair", "poor"].includes(String(w.score)) ? String(w.score) : "fair") as WordScore["score"],
        tip: w.tip && w.tip !== "null" ? String(w.tip) : undefined,
      }))
      .slice(0, 30);

    log.info({
      userId,
      overall: clampScore(parsed.overall),
      refLen: referenceText.length,
      transLen: transcript.length,
    }, "evaluate.done");

    return Response.json({
      overall: clampScore(parsed.overall),
      pronunciation: clampScore(parsed.pronunciation),
      intonation: clampScore(parsed.intonation),
      fluency: clampScore(parsed.fluency),
      stress: clampScore(parsed.stress),
      transcript,
      wordScores,
      summary: coerceString(parsed.summary),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    log.error({ err, aborted }, aborted ? "evaluate.timeout" : "evaluate.error");
    return Response.json(
      { error: aborted ? "Chấm điểm quá thời gian. Vui lòng thử lại." : "Không thể chấm điểm" },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
