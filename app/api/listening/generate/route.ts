import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listeningExercise } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import type { ListeningQuestion } from "@/lib/db/schema";

const GenerateSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  exerciseType: z.enum(["comprehension", "dictation", "fill_blanks"]).default("comprehension"),
});

const SYSTEM_PROMPT = `You are an English listening comprehension exercise creator.
Generate a short English passage and multiple-choice comprehension questions.

RULES:
- Passage length: A1/A2 = 40-80 words, B1/B2 = 80-120 words, C1/C2 = 100-150 words
- A1/A2 topics: daily life, greetings, shopping, weather
- B1/B2 topics: travel, work, health, education
- C1/C2 topics: business, technology, science, current events
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
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { level, exerciseType } = parsed.data;
    const userId = session.user.id;

    // Step 1: Generate passage + questions via AI
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a ${level} level listening exercise. Exercise type: ${exerciseType}.` },
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

    // Step 2: Save exercise to DB (audio will be generated on-demand via /api/listening/audio/[id])
    const [exercise] = await db
      .insert(listeningExercise)
      .values({
        userId,
        level,
        exerciseType,
        passage: generated.passage,
        audioUrl: "pending", // placeholder — updated below
        questions: generated.questions,
      })
      .returning();

    // Update audioUrl with the exercise id
    const audioUrl = `/api/listening/audio/${exercise.id}`;
    await db
      .update(listeningExercise)
      .set({ audioUrl })
      .where(eq(listeningExercise.id, exercise.id));

    return Response.json({
      id: exercise.id,
      level,
      exerciseType,
      passage: generated.passage,
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
