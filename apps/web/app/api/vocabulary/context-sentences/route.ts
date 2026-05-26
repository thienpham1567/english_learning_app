import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("vocabulary/context-sentences");

/**
 * POST /api/vocabulary/context-sentences
 *
 * Generates 5 TOEIC-style example sentences for a given vocabulary word.
 * Returns sentences in both English and Vietnamese with the target word highlighted.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { word, partOfSpeech, level } = body;

  if (!word || typeof word !== "string") {
    return Response.json({ error: "Missing word" }, { status: 400 });
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an English vocabulary tutor for TOEIC learners.
Generate exactly 5 example sentences using the given word.
Requirements:
- Use TOEIC-relevant contexts (business, office, travel, meetings, email, etc.)
- Vary difficulty from simple to complex
- Each sentence should demonstrate a different usage/collocation of the word
- Provide Vietnamese translation for each sentence
- Mark the target word in the English sentence with asterisks (e.g., *word*)

Return JSON:
{
  "sentences": [
    { "en": "The *annual* report was submitted on time.", "vi": "Báo cáo thường niên đã được nộp đúng hạn.", "context": "Business Report" }
  ]
}`,
        },
        {
          role: "user",
          content: `Word: "${word}"${partOfSpeech ? `, Part of speech: ${partOfSpeech}` : ""}${level ? `, CEFR Level: ${level}` : ""}. Generate 5 TOEIC-style example sentences.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty response" }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    return Response.json(parsed);
  } catch (err) {
    log.error({ err }, "vocabulary.context-sentences.failed");
    return Response.json({ error: "Failed to generate sentences" }, { status: 502 });
  }
}
