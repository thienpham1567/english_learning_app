import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { writingAttempt, writingErrorPattern } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import {
  type ExamVariant,
  buildScoringPrompt,
  countWords,
  MIN_WORD_COUNT,
  MAX_WORD_COUNT,
  SCORE_RANGES,
} from "@/lib/writing/rubric-prompts";
import { VALID_ERROR_TAGS } from "@/lib/writing/error-tags";
// Note: SCORE_RANGES used for targetScore validation below

/**
 * POST /api/writing/score
 *
 * Rubric-based essay scoring with inline issue detection.
 * Rate limited: 5/min/user (AC5).
 */

const VALID_EXAMS = new Set<ExamVariant>(["ielts-task2", "ielts-task1", "toefl-independent"]);

// Rate limiter (AC5) — 5 calls/min/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const now = Date.now();
  const userId = session.user.id;

  // Evict expired entries
  if (rateLimitMap.size > 500) {
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

  // Parse body
  const body = (await request.json().catch(() => null)) as {
    text?: string;
    prompt?: string;
    exam?: string;
    targetScore?: unknown;
    vocabBank?: Array<{ term: string }>;
    guidedPromptJson?: unknown;
  } | null;

  const text = body?.text?.trim();
  const exam = body?.exam as ExamVariant | undefined;
  const prompt = body?.prompt?.trim();

  // Validate targetScore: must be a finite number within the exam's range
  let targetScore: number | undefined;
  if (body?.targetScore !== undefined) {
    const raw = body.targetScore;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return Response.json({ error: "targetScore must be a finite number" }, { status: 400 });
    }
    const range = SCORE_RANGES[exam as ExamVariant];
    if (range && (raw < range.min || raw > range.max)) {
      return Response.json({ error: `targetScore out of range (${range.min}–${range.max}) for ${exam}` }, { status: 400 });
    }
    targetScore = raw;
  }

  if (!text) {
    return Response.json({ error: "No essay text provided" }, { status: 400 });
  }
  if (!exam || !VALID_EXAMS.has(exam)) {
    return Response.json({ error: "Invalid exam type (ielts-task2, ielts-task1, toefl-independent)" }, { status: 400 });
  }

  // Word count guard (AC3)
  const wordCount = countWords(text);
  if (wordCount < MIN_WORD_COUNT) {
    return Response.json({ error: "under-length", wordCount, minimum: MIN_WORD_COUNT }, { status: 422 });
  }
  if (wordCount > MAX_WORD_COUNT) {
    return Response.json({ error: `Essay too long (max ${MAX_WORD_COUNT} words)`, wordCount }, { status: 400 });
  }

  // Build prompts
  const rawVocab = body?.vocabBank;
  const vocabBank = Array.isArray(rawVocab)
    ? rawVocab.filter((v): v is { term: string } => typeof v?.term === "string" && v.term.length > 0)
    : undefined;
  const { system, user: userPrompt } = buildScoringPrompt(exam, text, prompt, targetScore, vocabBank);

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: {
      overall: number;
      criteria: {
        taskResponse: { score: number; feedback: string };
        coherence: { score: number; feedback: string };
        lexical: { score: number; feedback: string };
        grammar: { score: number; feedback: string };
      };
      inlineIssues: Array<{
        quote: string;
        category: string;
        suggestion: string;
        explanation: string;
      }>;
      strengths: string[];
      nextSteps: string[];
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[writing/score] JSON parse failed:", cleaned.slice(0, 200));
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    // Compute startOffset/endOffset server-side (dev notes: don't trust model offsets)
    const inlineIssues = (parsed.inlineIssues ?? [])
      .map((issue) => {
        const startOffset = text.indexOf(issue.quote);
        if (startOffset === -1) return null; // Drop if quote not found
        return {
          ...issue,
          startOffset,
          endOffset: startOffset + issue.quote.length,
        };
      })
      .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

    const result = {
      overall: parsed.overall,
      criteria: parsed.criteria,
      inlineIssues,
      strengths: parsed.strengths ?? [],
      nextSteps: parsed.nextSteps ?? [],
      wordCount,
    };

    // Persist (AC6)
    try {
      await db.insert(writingAttempt).values({
        userId,
        exam,
        prompt: prompt ?? null,
        text,
        overall: parsed.overall,
        criteriaJson: parsed.criteria,
        inlineIssuesJson: inlineIssues,
        guidedPromptJson: body?.guidedPromptJson ?? null,
      });
    } catch (err) {
      console.error("[writing/score] Persist failed:", err);
      // Non-fatal
    }

    // AC1: Classify error tags and upsert writingErrorPattern (non-fatal, fire-and-forget)
    void classifyAndUpsertPatterns(userId, inlineIssues).catch((err) =>
      console.error("[writing/score] Pattern classification failed:", err)
    );

    return Response.json(result);
  } catch (err) {
    console.error("[writing/score] Error:", err);
    return Response.json({ error: "Failed to score essay" }, { status: 502 });
  }
}

/* ── Pattern classifier + upsert (AC1, AC2) ─────────────────── */

type InlineIssueWithTag = {
  tag?: string;
  [key: string]: unknown;
};

async function classifyAndUpsertPatterns(
  userId: string,
  inlineIssues: InlineIssueWithTag[],
): Promise<void> {
  // Extract valid tags from the LLM-enriched inlineIssues
  const tagCounts = new Map<string, number>();
  for (const issue of inlineIssues) {
    const tag = issue.tag;
    if (typeof tag === "string" && VALID_ERROR_TAGS.has(tag)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  if (tagCounts.size === 0) return;

  const now = new Date();

  // Upsert each tag: increment count and update lastSeenAt
  for (const [tag, delta] of tagCounts) {
    try {
      const existing = await db
        .select()
        .from(writingErrorPattern)
        .where(and(eq(writingErrorPattern.userId, userId), eq(writingErrorPattern.tag, tag)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(writingErrorPattern)
          .set({ count: existing[0].count + delta, lastSeenAt: now })
          .where(eq(writingErrorPattern.id, existing[0].id));
      } else {
        await db.insert(writingErrorPattern).values({
          userId,
          tag,
          count: delta,
          lastSeenAt: now,
        });
      }
    } catch (err) {
      console.error("[writing/score] Upsert pattern failed for tag:", tag, err);
    }
  }
}
