import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/study-sets/generate
 *
 * AI-generates a complete 4-module study set around a single topic.
 * Body: { topicId: string, topicTitle: string, examMode: string, level: string }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { topicTitle, examMode, level } = body;

  if (!topicTitle) {
    return Response.json({ error: "topicTitle is required" }, { status: 400 });
  }

  const examCtx = examMode === "ielts"
    ? "IELTS Academic contexts"
    : "TOEIC business/workplace contexts";

  const systemPrompt = `You are an English content generator for Vietnamese learners preparing for ${examCtx}.
Generate a complete study set about "${topicTitle}" at ${level || "B1"} level.

Return ONLY valid JSON:
{
  "vocabulary": [
    { "word": "agenda", "ipa": "/əˈdʒɛndə/", "meaning": "Chương trình nghị sự", "example": "Let's review the agenda before the meeting.", "exampleVi": "Hãy xem lại chương trình trước cuộc họp." }
  ],
  "grammar": {
    "title": "Grammar point name",
    "formula": "S + should/could + V",
    "explanation": "Vietnamese explanation of the grammar point in context of ${topicTitle}",
    "topicExample": "Example sentence using this grammar in the topic context",
    "topicExampleVi": "Vietnamese translation"
  },
  "reading": {
    "title": "Short title for the passage",
    "passage": "A 100-150 word paragraph about ${topicTitle} suitable for ${level} learners.",
    "questions": [
      { "question": "Comprehension question", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": 1, "explanation": "Vietnamese explanation" }
    ]
  },
  "exercises": [
    { "sentence": "Fill-in sentence with ___ blank", "options": ["opt1", "opt2", "opt3", "opt4"], "answer": "correct option", "explanation": "Vietnamese explanation" }
  ]
}

Rules:
- vocabulary: exactly 8 words, all related to topic
- grammar: 1 grammar point most relevant to the topic
- reading: 1 passage (100-150 words) with 3 questions
- exercises: 3 fill-in-the-blank exercises
- All Vietnamese explanations
- Content MUST be thematically consistent around "${topicTitle}"`;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a study set about: ${topicTitle} (${level})` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const studySet = JSON.parse(content);
    return Response.json(studySet);
  } catch (err) {
    console.error("[study-sets/generate] Error:", err);
    return Response.json({ error: "Study set generation failed" }, { status: 502 });
  }
}
