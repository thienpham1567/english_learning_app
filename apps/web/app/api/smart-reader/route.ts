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

const SYSTEM_PROMPT = `You are a premium English-to-Vietnamese reading comprehension assistant specializing in GRAMMAR. Your job is to help Vietnamese learners deeply understand the grammar of English text.

INPUT HANDLING (check first):
- If the input is NOT meaningful English (e.g. it is Vietnamese, gibberish, random characters, or only a fragment that cannot be understood), do NOT invent an analysis. Return JSON where "naturalTranslation" politely states in Vietnamese that the text is not valid English to analyze (e.g. "Văn bản này không phải tiếng Anh hợp lệ để phân tích."), set "difficultyLevel" to "beginner", set "readingTips" to an empty string, and set "grammarAnalysis" to null.
- Otherwise, analyze the English text and respond with a JSON object containing exactly these fields:

1. "naturalTranslation": A natural, fluent Vietnamese translation of the ENTIRE text. NOT word-by-word, but COMPLETE — do not summarize, shorten, or omit any idea. Translate as a native Vietnamese speaker would express the same meaning, using natural Vietnamese word order and phrasing.

2. "difficultyLevel": "beginner" | "intermediate" | "advanced" — map to CEFR: beginner = A1–A2, intermediate = B1–B2, advanced = C1–C2. Judge by vocabulary rarity, sentence complexity, and idiomatic density.

3. "readingTips": One brief tip in Vietnamese about a pattern or technique from this text that helps reading comprehension.

4. "grammarAnalysis": A deep grammar analysis object. From the whole text, choose the 2–3 most complex or representative sentences and analyze those (a single short sentence → analyze just that one; do NOT try to cover every sentence; do NOT pad). It has:
   - "focusSummary": Vietnamese string naming the 1–2 most worthwhile grammar points of the whole text (what a learner should take away).
   - "sentences": an array, one item per analyzed sentence. Each item has:
     - "sentence": the exact sentence text from the input.
     - "structureLabel": overall sentence type in Vietnamese (e.g. "Câu đơn", "Câu ghép", "Câu phức", "Câu phức-ghép").
     - "skeleton": the core of the MAIN clause as an object:
       - "subject": the main subject (exact substring)
       - "verb": the main verb / verb phrase (exact substring)
       - "object": the main object or complement (exact substring), or null if there is none (e.g. passive or intransitive)
     - "clauseTree": an array of clause nodes representing the clause structure, NESTED to reflect dependency. Each node has:
       - "text": the clause text (exact substring of the sentence)
       - "type": clause type in English ("main clause", "subordinate clause", "relative clause", "adverbial clause", "noun clause", etc.)
       - "role": Vietnamese explanation of what this clause does in the sentence (e.g. "bổ nghĩa cho danh từ 'rate'", "chỉ lý do")
       - "connector": the connecting word/phrase if any (e.g. "because", "which", "at which"), else null
       - "children": an array of nested clause nodes (same shape); use [] when there are none. Nest a clause inside another ONLY when it genuinely depends on or modifies part of that clause.
     - "tenses": array of the important tenses in this sentence. Each item has:
       - "tense": tense name in English (e.g. "Present Perfect", "Past Simple")
       - "example": the exact words from the sentence using this tense
       - "contrast": Vietnamese explanation of WHY this tense is used here, explicitly contrasting with the tense a learner might wrongly use instead (e.g. why Present Perfect, not Past Simple).
     - "patterns": array of 1–3 notable grammar patterns in this sentence. Each item has:
       - "pattern": pattern name in English (e.g. "Passive + modal", "Conditional Type 2", "Inversion")
       - "inText": the exact part of the sentence showing this pattern
       - "ruleName": a short, lookup-friendly name of the underlying rule (e.g. "modal + be + past participle")
       - "usage": Vietnamese explanation of this pattern and when to use it
       - "extraExample": one short, different English example sentence illustrating the same rule
       - "studyHint": Vietnamese suggestion of what grammar topic to revise next to master this
     - "learnerNote": Vietnamese note about a mistake Vietnamese learners commonly make with the grammar in THIS sentence (articles, tense, word order, missing "be", etc.).

Rules:
- All Vietnamese output must be natural, colloquial Vietnamese — not robotic translation.
- Scale to text length: do NOT pad. Keep clauseTree accurate over deep — only nest where the structure genuinely nests.
- All "example", "inText", "sentence", "skeleton" values must be EXACT substrings from the input (do not paraphrase the English).
- Respond ONLY with valid JSON, no markdown, no explanation outside JSON.`;

type ClauseNode = {
  text: string;
  type: string;
  role: string;
  connector: string | null;
  children: ClauseNode[];
};

/** Defensive, recursive sanitizer for the clause tree (depth-capped). */
function sanitizeClauseTree(raw: unknown, depth = 0): ClauseNode[] {
  if (!Array.isArray(raw) || depth > 6) return [];
  return raw
    .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
    .map((n) => ({
      text: typeof n.text === "string" ? n.text : "",
      type: typeof n.type === "string" ? n.type : "clause",
      role: typeof n.role === "string" ? n.role : "",
      connector: typeof n.connector === "string" ? n.connector : null,
      children: sanitizeClauseTree(n.children, depth + 1),
    }))
    .filter((n) => n.text);
}

/** Normalize the new sentence-centric grammarAnalysis shape. */
function sanitizeGrammarAnalysis(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const sentencesRaw = Array.isArray(g.sentences) ? g.sentences : [];
  const sentences = sentencesRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => {
      const sk = (s.skeleton ?? {}) as Record<string, unknown>;
      return {
        sentence: typeof s.sentence === "string" ? s.sentence : "",
        structureLabel: typeof s.structureLabel === "string" ? s.structureLabel : "",
        skeleton: {
          subject: typeof sk.subject === "string" ? sk.subject : "",
          verb: typeof sk.verb === "string" ? sk.verb : "",
          object: typeof sk.object === "string" ? sk.object : null,
        },
        clauseTree: sanitizeClauseTree(s.clauseTree),
        tenses: Array.isArray(s.tenses) ? s.tenses : [],
        patterns: Array.isArray(s.patterns) ? s.patterns : [],
        learnerNote: typeof s.learnerNote === "string" ? s.learnerNote : "",
      };
    })
    .filter((s) => s.sentence);

  if (!sentences.length) return null;
  return {
    focusSummary: typeof g.focusSummary === "string" ? g.focusSummary : "",
    sentences,
  };
}

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
      difficultyLevel: (parsed.difficultyLevel as string) || "intermediate",
      readingTips: parsed.readingTips || "",
      grammarAnalysis: sanitizeGrammarAnalysis(parsed.grammarAnalysis),
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
