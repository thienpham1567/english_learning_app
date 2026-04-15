import { headers } from "next/headers";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { GenerateInputSchema } from "@/lib/listening/types";
import type { ListeningQuestion } from "@repo/database";
import { getExamContext, parseExamMode } from "@/lib/exam-mode/context";

function buildListeningSystemPrompt(examMode: "toeic" | "ielts"): string {
  const ctx = getExamContext(examMode);
  return `You are an English listening comprehension exercise creator for ${ctx.label} preparation.
Generate a short English passage and multiple-choice comprehension questions.

RULES:
- Passage length: A1/A2 = 40-80 words, B1/B2 = 80-120 words, C1/C2 = 100-150 words
${ctx.listeningPromptSuffix}
- Generate exactly 4 questions testing listening comprehension
- Each question has 4 options with exactly 1 correct answer
- Questions should test: main idea, details, inference, vocabulary in context

Return ONLY valid JSON (no markdown fences):
{
  "passage": "The full passage text...",
  "questions": [
    { "question": "What is the main idea?", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}`;
}

/**
 * POST /api/listening/generate
 *
 * Generates a listening comprehension exercise:
 * 1. AI creates a passage + MCQ questions
 * 2. TTS converts passage to audio
 * 3. Exercise is saved to DB
 *
 * Returns the exercise object with audioUrl pointing to /api/listening/audio/[id]
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = GenerateInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { level, exerciseType, examMode: rawMode } = parsed.data;
    const userId = session.user.id;
    const examMode = parseExamMode(rawMode);

    // Step 1: Generate passage + questions via AI
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: buildListeningSystemPrompt(examMode) },
        { role: "user", content: `Generate a ${level} level ${examMode.toUpperCase()} listening exercise. Exercise type: ${exerciseType}.` },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return Response.json({ error: "AI did not return content" }, { status: 502 });
    }

    let generated: { passage: string; questions: ListeningQuestion[] };
    try {
      generated = JSON.parse(rawContent);
    } catch {
      console.error("[Listening] Failed to parse AI response:", rawContent);
      return Response.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    if (!generated.passage || !Array.isArray(generated.questions) || generated.questions.length === 0) {
      return Response.json({ error: "AI response missing required fields" }, { status: 502 });
    }

    // Step 2: Save exercise to DB with pre-generated ID for audioUrl
    const id = randomUUID();
    const audioUrl = `/api/listening/audio/${id}`;

    const [exercise] = await db
      .insert(listeningExercise)
      .values({
        id,
        userId,
        level,
        exerciseType,
        passage: generated.passage,
        audioUrl,
        questions: generated.questions,
      })
      .returning();

    return Response.json({
      id: exercise.id,
      level,
      exerciseType,
      audioUrl,
      questions: generated.questions.map((q) => ({
        question: q.question,
        options: q.options,
        // Don't expose correctIndex to client during exercise
      })),
      createdAt: exercise.createdAt,
    });
  } catch (err) {
    console.error("[Listening] Generate error:", err);
    return Response.json({ error: "Failed to generate exercise" }, { status: 500 });
  }
}
