import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { writingErrorPattern, errorLog } from "@repo/database";
import { eq, and, gte, desc, inArray } from "drizzle-orm";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VALID_ERROR_TAGS, ERROR_TAG_DESCRIPTIONS, type ErrorTag } from "@/lib/writing/error-tags";

/**
 * POST /api/writing/pattern-quiz
 *
 * AC3: Generates 5 MCQ quiz items for a recurring error tag.
 * Takes { tag, exampleSentences: string[] (up to 3) } from the client.
 * Quiz items are persisted to error_log with sourceModule: "writing-pattern".
 * No essay content is passed to this endpoint (AC6).
 */

// Rate limiter: 10/min/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Minimum pattern count before quiz can be generated (AC2)
const MIN_PATTERN_COUNT = 3;
const PATTERN_WINDOW_DAYS = 14;

type QuizItem = {
  questionStem: string;
  options: string[];
  correctAnswer: string;
  explanationEn: string;
  explanationVi: string;
};

function buildQuizPrompt(tag: ErrorTag, description: string, examples: string[]): string {
  const exampleBlock = examples.length > 0
    ? `\nExample errors from this learner (anonymised, do NOT copy verbatim):\n${examples.map((s, i) => `${i + 1}. "${s}"`).join("\n")}\n`
    : "";

  return `You are an expert English grammar quiz writer.

Error pattern: "${tag}"
Description: ${description}
${exampleBlock}
TASK: Write 5 multiple-choice quiz items that target this specific error pattern.

RULES:
- Each question should have 4 options (A, B, C, D).
- Exactly one option is correct.
- The other 3 are plausible distractors.
- Question stems should be 1–2 sentences long.
- Do NOT copy any example sentence verbatim — create fresh items.
- Explanations should be brief and pedagogical (why the correct answer is right).
- Return ONLY valid JSON — no markdown fences.

JSON Schema:
{
  "items": [
    {
      "questionStem": "Choose the correct sentence:",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "explanationEn": "brief English explanation",
      "explanationVi": "giải thích ngắn bằng tiếng Việt"
    }
  ]
}`;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    tag?: string;
    exampleSentences?: string[];
  } | null;

  const tag = body?.tag;
  if (!tag || !VALID_ERROR_TAGS.has(tag)) {
    return Response.json({ error: "Invalid or missing error tag" }, { status: 400 });
  }

  // AC2: verify the pattern meets the threshold (≥3 in 14 days)
  const windowStart = new Date(Date.now() - PATTERN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const patterns = await db
    .select()
    .from(writingErrorPattern)
    .where(
      and(
        eq(writingErrorPattern.userId, userId),
        eq(writingErrorPattern.tag, tag),
        gte(writingErrorPattern.lastSeenAt, windowStart),
      )
    )
    .limit(1);

  if (patterns.length === 0 || patterns[0].count < MIN_PATTERN_COUNT) {
    return Response.json({
      error: `Pattern "${tag}" has not reached the minimum threshold (${MIN_PATTERN_COUNT} occurrences in ${PATTERN_WINDOW_DAYS} days)`,
    }, { status: 400 });
  }

  // AC6: only take up to 3 short example sentences, cap at 200 chars each
  const examples = (Array.isArray(body?.exampleSentences) ? body.exampleSentences : [])
    .filter((s): s is string => typeof s === "string")
    .slice(0, 3)
    .map((s) => s.slice(0, 200));

  const description = ERROR_TAG_DESCRIPTIONS[tag as ErrorTag];
  const prompt = buildQuizPrompt(tag as ErrorTag, description, examples);

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: { items: QuizItem[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[writing/pattern-quiz] JSON parse failed:", cleaned.slice(0, 200));
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return Response.json({ error: "AI returned no quiz items" }, { status: 502 });
    }

    const items = parsed.items.slice(0, 5);

    // AC5: persist to error_log with sourceModule "writing-pattern" for SRS review loop
    const insertedIds: string[] = [];
    for (const item of items) {
      try {
        const [row] = await db.insert(errorLog).values({
          userId,
          sourceModule: "writing-pattern",
          questionStem: item.questionStem,
          options: item.options,
          userAnswer: "",       // not yet answered
          correctAnswer: item.correctAnswer,
          explanationEn: item.explanationEn,
          explanationVi: item.explanationVi,
          grammarTopic: tag,
          isResolved: false,
        }).returning({ id: errorLog.id });
        if (row) insertedIds.push(row.id);
      } catch (err) {
        console.error("[writing/pattern-quiz] Insert errorLog failed:", err);
      }
    }

    // Update quizGeneratedAt on the pattern
    await db
      .update(writingErrorPattern)
      .set({ quizGeneratedAt: new Date() })
      .where(eq(writingErrorPattern.id, patterns[0].id));

    return Response.json({ items, insertedIds });
  } catch (err) {
    console.error("[writing/pattern-quiz] Error:", err);
    return Response.json({ error: "Failed to generate quiz" }, { status: 502 });
  }
}

/* ── GET — fetch active patterns for current user ────────────── */

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowStart = new Date(Date.now() - PATTERN_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const patterns = await db
    .select()
    .from(writingErrorPattern)
    .where(
      and(
        eq(writingErrorPattern.userId, session.user.id),
        gte(writingErrorPattern.lastSeenAt, windowStart),
        gte(writingErrorPattern.count, MIN_PATTERN_COUNT), // Patch 3: filter server-side
      )
    )
    .orderBy(desc(writingErrorPattern.count));

  return Response.json({ patterns });
}

/* ── PATCH — update quiz answers after inline completion (AC5) ── */

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    answers?: Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>;
  } | null;

  const answers = body?.answers;
  if (!Array.isArray(answers) || answers.length === 0) {
    return Response.json({ error: "No answers provided" }, { status: 400 });
  }

  let updated = 0;
  for (const ans of answers.slice(0, 10)) {
    if (!ans.errorLogId || typeof ans.userAnswer !== "string") continue;
    try {
      await db
        .update(errorLog)
        .set({
          userAnswer: ans.userAnswer,
          isResolved: ans.isCorrect,
          resolvedAt: ans.isCorrect ? new Date() : null,
        })
        .where(
          and(
            eq(errorLog.id, ans.errorLogId),
            eq(errorLog.userId, session.user.id),
          )
        );
      updated++;
    } catch (err) {
      console.error("[writing/pattern-quiz] PATCH update failed:", err);
    }
  }

  return Response.json({ updated });
}
