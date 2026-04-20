import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/writing/guided-prompt
 *
 * Generates a writing prompt with outline + vocab bank for guided writing.
 * AC1: accepts { exam, targetBand, topicCategory? }
 * AC2: outline 3–5 bullets, vocab bank 6–10 B2/C1 terms
 */

export type TopicCategory = "education" | "technology" | "environment" | "health" | "society" | "work";

export type VocabBankItem = {
  term: string;
  meaning: string;
  example: string;
};

export type GuidedPromptResponse = {
  prompt: string;
  outline: string[];
  vocabBank: VocabBankItem[];
  topicCategory: TopicCategory;
};

const VALID_CATEGORIES = new Set<TopicCategory>(["education", "technology", "environment", "health", "society", "work"]);
const VALID_EXAMS = new Set(["ielts-task2", "ielts-task1", "toefl-independent"]);

// Rate limiter: 20/min/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const EXAM_LABELS: Record<string, string> = {
  "ielts-task2": "IELTS Writing Task 2",
  "ielts-task1": "IELTS Writing Task 1",
  "toefl-independent": "TOEFL Independent Writing",
};

function buildGuidedPrompt(exam: string, category: TopicCategory, targetBand?: number): string {
  const examLabel = EXAM_LABELS[exam] ?? exam;
  const bandNote = targetBand ? `\nThe learner is targeting band ${targetBand}. Adjust complexity accordingly.` : "";

  return `You are an expert ${examLabel} writing coach. Generate a practice prompt for the learner.

Topic category: ${category}
${bandNote}

INSTRUCTIONS:
1. Write a realistic ${examLabel} prompt/question.
2. Provide an outline with 3–5 bullets: introduction stance, 2–3 body paragraph points, and a conclusion hook.
3. Provide a vocab bank with 6–10 B2/C1 level terms relevant to this topic.
   - Each term should be "ambitious but defensible" — useful for a strong essay but not obscure.
   - Include the term, a brief meaning, and one natural usage example sentence.
4. Return ONLY valid JSON — no markdown fences.

JSON Schema:
{
  "prompt": "the full writing prompt/question",
  "outline": ["intro stance", "body point 1", "body point 2", "body point 3", "conclusion hook"],
  "vocabBank": [
    {
      "term": "word or phrase",
      "meaning": "brief definition",
      "example": "example sentence using the term"
    }
  ]
}`;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const userId = session.user.id;
  const now = Date.now();
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
    exam?: string;
    targetBand?: number;
    topicCategory?: string;
  } | null;

  const exam = body?.exam;
  if (!exam || !VALID_EXAMS.has(exam)) {
    return Response.json({ error: "Invalid exam type" }, { status: 400 });
  }

  // Category — default to random from list (AC4)
  let category: TopicCategory;
  if (body?.topicCategory && VALID_CATEGORIES.has(body.topicCategory as TopicCategory)) {
    category = body.topicCategory as TopicCategory;
  } else {
    const cats = [...VALID_CATEGORIES];
    category = cats[Math.floor(Math.random() * cats.length)];
  }

  const targetBand = typeof body?.targetBand === "number" ? body.targetBand : undefined;

  const prompt = buildGuidedPrompt(exam, category, targetBand);

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7, // Higher for variety
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: { prompt: string; outline: string[]; vocabBank: VocabBankItem[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[writing/guided-prompt] JSON parse failed:", cleaned.slice(0, 200));
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    // Validate shape
    if (!parsed.prompt || !Array.isArray(parsed.outline) || !Array.isArray(parsed.vocabBank)) {
      return Response.json({ error: "AI response missing required fields" }, { status: 502 });
    }

    // Enforce minimum lengths (AC2)
    if (parsed.outline.length < 3 || parsed.vocabBank.length < 6) {
      console.error("[writing/guided-prompt] AI returned too few items:", {
        outlineLen: parsed.outline.length,
        vocabLen: parsed.vocabBank.length,
      });
      return Response.json({ error: "AI response incomplete — please try again" }, { status: 502 });
    }

    const result: GuidedPromptResponse = {
      prompt: parsed.prompt,
      outline: parsed.outline.slice(0, 5), // Cap at 5
      vocabBank: parsed.vocabBank.slice(0, 10), // Cap at 10
      topicCategory: category,
    };

    return Response.json(result);
  } catch (err) {
    console.error("[writing/guided-prompt] Error:", err);
    return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
  }
}
