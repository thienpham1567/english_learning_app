import { db, smartReaderHistory } from "@repo/database";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { extractJson } from "@/lib/openai/extract-json";

const log = routeLogger("smart-reader");

const MAX_INPUT_LENGTH = 3000;
const DAILY_RATE_LIMIT = 30;

const SYSTEM_PROMPT = `You are a premium English-to-Vietnamese reading comprehension assistant. Your job is to help Vietnamese learners deeply understand English text.

INPUT HANDLING (check first):
- If the input is NOT meaningful English (e.g. it is Vietnamese, gibberish, random characters, or only a fragment that cannot be understood), do NOT invent an analysis. Return JSON where "naturalTranslation" politely states in Vietnamese that the text is not valid English to analyze (e.g. "Văn bản này không phải tiếng Anh hợp lệ để phân tích."), set "difficultyLevel" to "beginner", and return empty arrays for breakdown/vocabulary, an empty readingTips, and null grammarAnalysis.
- Otherwise, analyze the English text and respond with a JSON object containing:

1. "naturalTranslation": A natural, fluent Vietnamese translation of the ENTIRE text. NOT word-by-word, but COMPLETE — do not summarize, shorten, or omit any idea. Translate as a native Vietnamese speaker would express the same meaning, using natural Vietnamese word order and phrasing.

2. "breakdown": An array of key phrases/patterns worth explaining. Each item has:
   - "phrase": the English phrase (exact substring from the text)
   - "meaning": Vietnamese meaning
   - "note": grammar pattern, formality level, or usage tip (in Vietnamese)
   Focus on: idioms, phrasal verbs, complex structures, formal/informal markers, connectors.

3. "vocabulary": An array of important words. Each item has:
   - "word": the English word (base/dictionary form)
   - "ipa": IPA pronunciation including slashes, e.g. "/əˈbʌv/"
   - "pos": part of speech (noun, verb, adj, adv, etc.)
   - "meaning": Vietnamese meaning
   - "example": a simple English example sentence using this word

4. "difficultyLevel": "beginner" | "intermediate" | "advanced" — map to CEFR: beginner = A1–A2, intermediate = B1–B2, advanced = C1–C2. Judge by vocabulary rarity, sentence complexity, and idiomatic density.

5. "readingTips": One brief tip in Vietnamese about a pattern or technique from this text that helps reading comprehension.

6. "grammarAnalysis": A grammar analysis object. If the text contains multiple sentences, pick the 1–2 most complex/representative sentences and analyze those (do not try to cover every sentence). It has:
   - "sentenceStructure": overall sentence type description in Vietnamese (e.g. "Câu phức với mệnh đề phụ", "Câu ghép")
   - "tenses": array of tenses found. Each item has:
     - "tense": tense name in English (e.g. "Present Perfect", "Past Simple")
     - "example": the exact words from the text using this tense
     - "explanation": brief Vietnamese explanation of WHY this tense is used here
   - "clauses": array of clauses in the analyzed sentence(s). Each item has:
     - "text": the clause text (exact substring from the original)
     - "type": clause type in English ("main clause", "subordinate clause", "relative clause", "adverbial clause", "noun clause", etc.)
     - "connector": the connecting word/phrase if any (e.g. "because", "which", "that")
   - "keyPatterns": array of notable grammar patterns. Each item has:
     - "pattern": grammar pattern name in English (e.g. "Passive Voice", "Conditional Type 2", "Inversion")
     - "inText": the exact part of the text showing this pattern
     - "usage": Vietnamese explanation of this pattern and when to use it
   Keep tenses to the most important ones found. Keep clauses accurate. Keep keyPatterns to 1–3 most notable patterns.

Rules:
- All Vietnamese output must be natural, colloquial Vietnamese — not robotic translation
- Scale quantity to text length: do NOT pad. A single short sentence may have only 1–3 vocabulary items; a long passage up to 8.
- Keep breakdown to the 3–6 most important phrases (not every phrase), fewer for short text
- Keep vocabulary to the 4–8 most useful words, fewer for short text
- Respond ONLY with valid JSON, no markdown, no explanation outside JSON`;

/** Simple SHA-256 hash using Web Crypto API */
async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text.toLowerCase().trim());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string") {
    return Response.json({ error: "Missing text field" }, { status: 400 });
  }

  const text = body.text.trim();
  if (text.length > MAX_INPUT_LENGTH) {
    return Response.json(
      { error: `Text too long. Maximum ${MAX_INPUT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // ── Rate limiting: count today's requests ──
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(smartReaderHistory)
      .where(
        and(eq(smartReaderHistory.userId, userId), gte(smartReaderHistory.createdAt, todayStart)),
      );
    if (countResult && countResult.count >= DAILY_RATE_LIMIT) {
      return Response.json(
        { error: `Daily limit reached (${DAILY_RATE_LIMIT} analyses/day). Try again tomorrow.` },
        { status: 429 },
      );
    }
  } catch (err) {
    log.error({ err }, "smart-reader.rate-limit.check.failed");
    // Don't block on rate limit check failure
  }

  // ── Cache check: hash sourceText and look for existing result ──
  const textHash = await hashText(text);
  try {
    const [cached] = await db
      .select({
        id: smartReaderHistory.id,
        result: smartReaderHistory.result,
      })
      .from(smartReaderHistory)
      .where(eq(smartReaderHistory.sourceTextHash, textHash))
      .orderBy(desc(smartReaderHistory.createdAt))
      .limit(1);

    if (cached) {
      log.info({ hash: textHash.slice(0, 8) }, "smart-reader.cache.hit");

      // Save a new history entry for this user (reusing cached result)
      try {
        const [saved] = await db
          .insert(smartReaderHistory)
          .values({
            userId,
            sourceText: text,
            sourceTextHash: textHash,
            result: cached.result,
            difficultyLevel:
              (cached.result as Record<string, string>).difficultyLevel || "intermediate",
            preview: text.slice(0, 100),
          })
          .returning({ id: smartReaderHistory.id });

        return Response.json({ ...cached.result, id: saved.id, cached: true });
      } catch {
        return Response.json({ ...cached.result, cached: true });
      }
    }
  } catch (err) {
    log.error({ err }, "smart-reader.cache.check.failed");
    // Fall through to AI call
  }

  // ── Call AI ──
  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.smartReaderModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from model");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(raw) as Record<string, unknown>;
    } catch {
      log.error({ raw: raw.slice(0, 500) }, "smart-reader.json.parse.failed");
      return Response.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 },
      );
    }

    // Ensure required fields exist
    const result = {
      naturalTranslation: parsed.naturalTranslation || "",
      breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      difficultyLevel: (parsed.difficultyLevel as string) || "intermediate",
      readingTips: parsed.readingTips || "",
      grammarAnalysis: parsed.grammarAnalysis
        ? {
            sentenceStructure:
              (parsed.grammarAnalysis as Record<string, unknown>).sentenceStructure || "",
            tenses: Array.isArray(
              (parsed.grammarAnalysis as Record<string, unknown>).tenses,
            )
              ? (parsed.grammarAnalysis as Record<string, unknown>).tenses
              : [],
            clauses: Array.isArray(
              (parsed.grammarAnalysis as Record<string, unknown>).clauses,
            )
              ? (parsed.grammarAnalysis as Record<string, unknown>).clauses
              : [],
            keyPatterns: Array.isArray(
              (parsed.grammarAnalysis as Record<string, unknown>).keyPatterns,
            )
              ? (parsed.grammarAnalysis as Record<string, unknown>).keyPatterns
              : [],
          }
        : null,
    };

    // Save to DB with hash for future cache hits
    try {
      const [saved] = await db
        .insert(smartReaderHistory)
        .values({
          userId,
          sourceText: text,
          sourceTextHash: textHash,
          result,
          difficultyLevel: result.difficultyLevel,
          preview: text.slice(0, 100),
        })
        .returning({ id: smartReaderHistory.id });

      return Response.json({ ...result, id: saved.id });
    } catch (dbErr) {
      log.error({ err: dbErr }, "smart-reader.db.save.failed");
      return Response.json(result);
    }
  } catch (err) {
    log.error({ err }, "smart-reader.analysis.failed");

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("429") || message.includes("rate")) {
      return Response.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
