import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("grammar-quiz/generate");

import { recordLearningEvent } from "@repo/modules";
import { getExamContext, parseExamMode } from "@/lib/exam-mode/context";
import { QuizGenerationResponseSchema } from "@/lib/grammar-quiz/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const RequestBodySchema = z.object({
  level: z.enum(["easy", "medium", "hard"]),
  count: z.number().int().min(1).max(20).default(10),
  examMode: z.enum(["toeic", "ielts"]).optional(),
});

function buildGrammarSystemPrompt(examMode: "toeic" | "ielts"): string {
  const ctx = getExamContext(examMode);

  if (examMode === "toeic") {
    return `You are a professional TOEIC Part 5 (Incomplete Sentences) question writer with expertise in ETS-style item design.

FORMAT:
- Each item is a single sentence with ONE blank (marked with _______)
- Exactly 4 answer options (A, B, C, D) — one correct, three distractors
- Sentences must be 15–30 words, using natural business English

QUESTION TYPE DISTRIBUTION (mix these in each set):
1. WORD FORM (30%): Test noun/verb/adjective/adverb form
   e.g. "The _______ of the new policy was announced yesterday." → (A) implement (B) implementation (C) implementing (D) implemented
2. VERB TENSE & FORM (25%): Test tense, voice, subject-verb agreement, gerund/infinitive
   e.g. "The budget report _______ by the finance team before the deadline." → (A) was completed (B) completing (C) has completing (D) complete
3. PREPOSITION & CONJUNCTION (15%): Test correct preposition or linking word
   e.g. "_______ the heavy rain, the outdoor event proceeded as scheduled." → (A) Despite (B) Although (C) Because (D) Unless
4. PRONOUN & DETERMINER (10%): Test relative pronouns, reflexive pronouns, possessives
   e.g. "Employees _______ wish to attend the seminar must register by Friday." → (A) whom (B) who (C) which (D) whose
5. VOCABULARY IN CONTEXT (20%): Test word meaning, collocation, or commonly confused words
   e.g. "The company plans to _______ its product line to include organic options." → (A) expand (B) expend (C) extend (D) expose

DISTRACTOR DESIGN RULES:
- All 4 options must be the SAME part of speech OR closely related word forms
- Include common TOEIC traps: similar-sounding words, wrong tense, wrong word form
- Never include obviously wrong or absurd options
- Distractors should be plausible in other contexts but wrong in THIS sentence

CONTEXT & VOCABULARY:
- Business settings: office memos, meeting announcements, product launches, quarterly reports
- Workplace scenarios: hiring, training, performance reviews, project management
- Professional communication: emails, presentations, phone calls, negotiations
- Industries: finance, marketing, HR, IT, manufacturing, retail, hospitality

DIFFICULTY CALIBRATION:
- easy: Common collocations, basic tenses, straightforward word forms (TOEIC 400-500 level)
- medium: Mixed tenses, conditional, passive voice, less common prepositions (TOEIC 500-700 level)
- hard: Subtle word choice, complex clauses, inversion, subjunctive-like patterns (TOEIC 700-900 level)

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "questions": [
    {
      "stem": "The manager _______ the report before the meeting started.",
      "options": ["review", "reviews", "had reviewed", "reviewing"],
      "correctIndex": 2,
      "explanationEn": "The past perfect (had + past participle) is used for an action completed before another past action.",
      "explanationVi": "Thì quá khứ hoàn thành (had + V3) dùng cho hành động hoàn tất trước một hành động khác trong quá khứ.",
      "examples": ["She had finished lunch before I arrived.", "They had left the office by 6 PM."],
      "grammarTopic": "past perfect"
    }
  ]
}`;
  }

  // IELTS fallback
  return `You are a ${ctx.label} grammar quiz generator.
Generate multiple-choice questions for ${ctx.label} exam preparation.
${ctx.grammarPromptSuffix}

Each question presents a sentence with a blank that must be filled with the correct word or phrase.
Each question must have exactly 4 options with exactly one correct answer.
Provide the grammar explanation in both English and Vietnamese (separate fields).
Also provide exactly 2 short example sentences demonstrating the correct grammar usage.

Difficulty levels:
- easy: Basic grammar (simple tenses, common prepositions, basic word forms)
- medium: Intermediate grammar (perfect tenses, conditionals, passive voice, relative clauses)
- hard: Advanced grammar (subjunctive, inversion, complex noun phrases, subtle word choice)

IMPORTANT: Return ONLY valid JSON matching this exact schema:
{
  "questions": [
    {
      "stem": "The manager _____ the report before the meeting started.",
      "options": ["review", "reviews", "had reviewed", "reviewing"],
      "correctIndex": 2,
      "explanationEn": "We use the past perfect tense for an action completed before another past action.",
      "explanationVi": "Chúng ta dùng thì quá khứ hoàn thành cho hành động xảy ra trước một hành động khác trong quá khứ.",
      "examples": ["She had finished lunch before I arrived.", "They had left the office by 6 PM."],
      "grammarTopic": "past perfect"
    }
  ]
}`;
}

// Simple in-memory rate limiter: max 5 requests per user per minute
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { level, count, examMode: rawMode } = parsed.data;
  const examMode = parseExamMode(rawMode);

  // Try up to 2 times to get valid output from AI
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildGrammarSystemPrompt(examMode) },
          {
            role: "user",
            content: `Generate exactly ${count} ${examMode === "ielts" ? "IELTS-style" : "TOEIC Part 5"} grammar questions at "${level}" difficulty. Return JSON only.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        continue;
      }

      const json = JSON.parse(content);
      const validated = QuizGenerationResponseSchema.safeParse(json);

      if (validated.success) {
        // Emit learning event (fire-and-forget, AC: 3)
        void recordLearningEvent({
          userId: session.user.id,
          sessionId: `grammar-${session.user.id}-${Date.now()}`,
          moduleType: "grammar_quiz",
          contentId: `quiz-${level}-${count}`,
          attemptId: `grammar-${Date.now()}`,
          eventType: "ai_feedback_generated",
          result: "neutral",
          score: null,
          durationMs: 0,
          difficulty:
            level === "easy" ? "beginner" : level === "hard" ? "advanced" : "intermediate",
        });

        return Response.json({ questions: validated.data.questions });
      }

      // Invalid format — retry
      log.warn(
        { attempt: attempt + 1, errors: validated.error.flatten() },
        "grammar-quiz.generate.validation.failed",
      );
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "grammar-quiz.generate.failed");
    }
  }

  return Response.json({ error: "Failed to generate quiz. Please try again." }, { status: 502 });
}
