import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/grammar-lessons/generate
 *
 * AI-generates a grammar lesson with explanation, examples, mistakes, and exercises.
 * Body: { topic: string, topicTitle: string, examMode: string, level: string }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { topic, topicTitle, examMode, level } = body;

  if (!topic || !topicTitle) {
    return Response.json({ error: "topic and topicTitle are required" }, { status: 400 });
  }

  const examContext = examMode === "ielts"
    ? "IELTS Academic writing and speaking contexts"
    : "TOEIC business and workplace contexts";

  const systemPrompt = `You are an English grammar teacher for Vietnamese learners preparing for ${examContext}.
Generate a complete grammar lesson for the topic: "${topicTitle}" at ${level || "B1"} level.

Return ONLY valid JSON with this structure:
{
  "title": "${topicTitle}",
  "titleVi": "Vietnamese translation of the topic name",
  "formula": "Grammar formula/structure (e.g., S + have/has + V3/ed)",
  "explanation": "Clear Vietnamese explanation of the grammar rule (3-4 sentences). Use simple language.",
  "examples": [
    { "en": "English sentence", "vi": "Vietnamese translation", "highlight": "key grammar part" },
    { "en": "...", "vi": "...", "highlight": "..." },
    { "en": "...", "vi": "...", "highlight": "..." }
  ],
  "commonMistakes": [
    { "wrong": "Incorrect sentence", "correct": "Correct sentence", "note": "Vietnamese explanation of why it's wrong" },
    { "wrong": "...", "correct": "...", "note": "..." }
  ],
  "exercises": [
    { "id": "1", "sentence": "Fill-in sentence with ___ blank", "answer": "correct answer", "options": ["option1", "option2", "option3", "option4"], "explanation": "Vietnamese explanation of why this is correct" },
    { "id": "2", "sentence": "...", "answer": "...", "options": ["..."], "explanation": "..." },
    { "id": "3", "sentence": "...", "answer": "...", "options": ["..."], "explanation": "..." }
  ]
}

Rules:
- All explanations in Vietnamese
- Examples should use ${examContext}
- Exercises: exactly 3, each with 4 options
- Common mistakes: exactly 2, focusing on Vietnamese speaker errors
- Keep it practical and relevant to exam preparation`;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a grammar lesson for: ${topicTitle} (${level})` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const lesson = JSON.parse(content);
    return Response.json(lesson);
  } catch (err) {
    console.error("[grammar-lessons/generate] Error:", err);
    return Response.json({ error: "Lesson generation failed" }, { status: 502 });
  }
}
