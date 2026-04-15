import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { getExamContext } from "@/lib/exam-mode/context";
import type { ExamMode } from "@/components/app/shared/ExamModeProvider";

/**
 * POST /api/mock-test/generate
 *
 * Generates a mini mock test based on the user's exam mode.
 * TOEIC: Part 5 (fill-in-blank) + Part 6 (text completion) style
 * IELTS: Reading passage + comprehension questions
 *
 * Body: { examMode?: "toeic" | "ielts", questionCount?: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let examModeFromBody: string | undefined;
  let questionCount = 15;

  try {
    const body = await request.json();
    examModeFromBody = body.examMode;
    if (typeof body.questionCount === "number" && body.questionCount >= 5 && body.questionCount <= 30) {
      questionCount = body.questionCount;
    }
  } catch {
    // defaults
  }

  let examMode: ExamMode;
  if (examModeFromBody === "toeic" || examModeFromBody === "ielts") {
    examMode = examModeFromBody;
  } else {
    const prefRows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);
    examMode = (prefRows[0]?.examMode as ExamMode) ?? "toeic";
  }

  const ctx = getExamContext(examMode);

  const systemPrompt = examMode === "toeic" ? buildToeicPrompt(questionCount) : buildIeltsPrompt(questionCount);

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a ${ctx.label} mini mock test with exactly ${questionCount} questions. Return JSON only.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
      return Response.json({ error: "Invalid AI response" }, { status: 502 });
    }

    // Validate IELTS passage exists
    if (examMode === "ielts" && !parsed.passage) {
      console.warn("[mock-test/generate] IELTS response missing passage field");
    }

    return Response.json({
      examMode,
      timeLimit: examMode === "toeic" ? questionCount * 40 : questionCount * 60, // seconds
      questions: parsed.questions,
      passage: parsed.passage ?? null,
    });
  } catch (err) {
    console.error("[mock-test/generate] Error:", err);
    return Response.json({ error: "Failed to generate test" }, { status: 502 });
  }
}

function buildToeicPrompt(count: number): string {
  return `You are a TOEIC Reading Section test generator.
Generate exactly ${count} questions mixing these TOEIC part types:

Part 5 — Incomplete Sentences (60% of questions):
- A sentence with a blank (_____)
- 4 answer options, 1 correct
- Tests: grammar, vocabulary, word forms

Part 6 — Text Completion (40% of questions):
- A short passage (2-4 sentences) with a blank
- 4 answer options, 1 correct
- Tests: contextual vocabulary, grammar in context

Each question must have:
- "type": "part5" or "part6"
- "passage": null for part5, or the passage text for part6
- "stem": The question/sentence with _____
- "options": exactly 4 strings
- "correctIndex": 0-3
- "explanationEn": brief English explanation
- "explanationVi": brief Vietnamese explanation
- "topic": grammar/vocabulary topic tested

Context: business emails, memos, advertisements, notices, reports.

Return ONLY valid JSON:
{
  "questions": [
    {
      "type": "part5",
      "passage": null,
      "stem": "The quarterly report _____ by the finance department last week.",
      "options": ["was prepared", "has prepared", "preparing", "prepare"],
      "correctIndex": 0,
      "explanationEn": "Passive voice is needed here...",
      "explanationVi": "Cần dùng câu bị động...",
      "topic": "passive voice"
    }
  ]
}`;
}

function buildIeltsPrompt(count: number): string {
  return `You are an IELTS Academic Reading test generator.
Generate exactly ${count} questions based on a reading passage.

First, create ONE academic passage (250-350 words) about a scientific, environmental, or social topic.
Then generate questions about it mixing these types:

- "multiple-choice": Standard MCQ with 4 options (40% of questions)
- "true-false-ng": True/False/Not Given statements (30% of questions)
- "fill-blank": Sentence completion from the passage (30% of questions)

Each question must have:
- "type": "multiple-choice", "true-false-ng", or "fill-blank"
- "stem": The question or statement
- "options": 4 strings for MCQ, ["True", "False", "Not Given"] for TFNG, null for fill-blank
- "correctIndex": 0-based index for MCQ/TFNG, null for fill-blank
- "correctAnswer": string answer for fill-blank, null for others
- "explanationEn": brief English explanation
- "explanationVi": brief Vietnamese explanation
- "topic": skill tested (scanning, inference, detail, vocabulary)

Return ONLY valid JSON:
{
  "passage": "The full academic passage text...",
  "questions": [
    {
      "type": "multiple-choice",
      "stem": "What is the main purpose of the study?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "correctAnswer": null,
      "explanationEn": "...",
      "explanationVi": "...",
      "topic": "main idea"
    }
  ]
}`;
}
