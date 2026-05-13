import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("vocabulary/word-family");

/**
 * POST /api/vocabulary/word-family
 *
 * AI-powered Word Family Explorer.
 * Given a word, returns all its forms (noun, verb, adjective, adverb)
 * with example sentences and TOEIC frequency indicators.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { word } = body;

  if (!word || typeof word !== "string") {
    return Response.json({ error: "Missing word" }, { status: 400 });
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a vocabulary expert for TOEIC learners.
Given a word, provide its COMPLETE word family (all derivations).

Return JSON:
{
  "rootWord": "the base/root word",
  "family": [
    {
      "word": "success",
      "partOfSpeech": "noun",
      "pronunciation": "/səkˈses/",
      "meaningVi": "sự thành công",
      "exampleEn": "The *success* of the project exceeded expectations.",
      "exampleVi": "Sự thành công của dự án vượt ngoài mong đợi.",
      "toeicFrequency": "high",
      "commonCollocations": ["achieve success", "key to success"]
    }
  ],
  "tip": "A brief tip in Vietnamese about remembering this word family",
  "toeicNote": "How this word family appears in TOEIC (in Vietnamese)"
}

Include ALL forms: noun(s), verb(s), adjective(s), adverb(s), and any other derivatives.
Mark toeicFrequency as "high", "medium", or "low".
Use asterisks to highlight the target word in examples.`,
        },
        {
          role: "user",
          content: `Word: "${word}". Provide the complete word family with all derivations.`,
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
    log.error({ err }, "vocabulary.word-family.failed");
    return Response.json({ error: "Failed to generate word family" }, { status: 502 });
  }
}
