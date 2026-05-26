import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { transcribeSpeakingAudio } from "@/lib/speaking/transcribe";

const log = routeLogger("toeic-speaking/describe-picture");

const MAX_TRANSCRIPT_LEN = 2000;
const MAX_DURATION_MS = 60_000;
const OPENAI_TIMEOUT_MS = 30_000;
const MIN_WORDS = 3;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function clampScore(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function coerceString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function coerceStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string").slice(0, 5);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = Date.now();

  // Rate limiting
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX)
      return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
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
  if (!(audioFile instanceof File))
    return Response.json({ error: "No audio file" }, { status: 400 });

  const scene = coerceString(formData.get("scene")).trim();
  if (!scene) return Response.json({ error: "scene is required" }, { status: 400 });

  let keyElements: string[] = [];
  try {
    keyElements = JSON.parse(coerceString(formData.get("keyElements"), "[]"));
  } catch {
    /* empty */
  }

  const durationRaw = formData.get("durationMs");
  const durationMs = typeof durationRaw === "string" ? Number(durationRaw) : NaN;
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) {
    return Response.json({ error: `Invalid durationMs (1..${MAX_DURATION_MS})` }, { status: 400 });
  }

  // Transcribe
  const transcription = await transcribeSpeakingAudio(audioFile, durationMs);
  if (!transcription.ok)
    return Response.json({ error: transcription.error }, { status: transcription.status });
  const transcript = transcription.text.slice(0, MAX_TRANSCRIPT_LEN);

  if (!transcript || transcript.trim().split(/\s+/).filter(Boolean).length < MIN_WORDS) {
    return Response.json(
      { error: "no-speech", message: "Không nhận dạng được giọng nói." },
      { status: 422 },
    );
  }

  const prompt = `You are a TOEIC Speaking Part 1 examiner evaluating a "Describe a Picture" response.

The picture shows: ${scene}
Key elements that should be mentioned: ${keyElements.join(", ")}
Duration: ${Math.round(durationMs / 1000)}s (target: 45s)

<<<TRANSCRIPT>>>
${transcript}
<<<END TRANSCRIPT>>>

Evaluate based on TOEIC Speaking Part 1 rubric and return ONLY valid JSON:
{
  "pronunciation": 0-100,
  "intonation": 0-100,
  "grammar": 0-100,
  "vocabulary": 0-100,
  "overall": 0-100,
  "summary": "2-3 sentence overall feedback in Vietnamese",
  "improvements": ["suggestion 1 in Vietnamese", "suggestion 2", "suggestion 3"]
}

Score guide: 80-100=excellent, 60-79=good, 40-59=needs work, 0-39=poor.
Check if the speaker mentioned the key elements. Be encouraging but honest.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openAiClient.chat.completions.create(
      {
        model: openAiConfig.chatModel,
        messages: [
          { role: "system", content: "You are a TOEIC Speaking examiner. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      log.error({ preview: cleaned.slice(0, 120) }, "describe-picture.json.parse.failed");
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    return Response.json({
      pronunciation: clampScore(parsed.pronunciation),
      intonation: clampScore(parsed.intonation),
      grammar: clampScore(parsed.grammar),
      vocabulary: clampScore(parsed.vocabulary),
      overall: clampScore(parsed.overall),
      transcript,
      summary: coerceString(parsed.summary),
      improvements: coerceStringArray(parsed.improvements),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    log.error({ err, aborted }, aborted ? "describe-picture.timeout" : "describe-picture.error");
    return Response.json(
      { error: aborted ? "Evaluation timed out" : "Failed to evaluate" },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
