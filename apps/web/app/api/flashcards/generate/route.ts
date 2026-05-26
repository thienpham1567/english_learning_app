import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("flashcards/generate");

/**
 * POST /api/flashcards/generate
 *
 * AI generates flashcards for a given TOEIC topic.
 * Body: { topic: string, type: "vocab" | "grammar" | "mixed", count?: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    topic,
    type = "mixed",
    count = 10,
  } = body as {
    topic?: string;
    type?: "vocab" | "grammar" | "mixed";
    count?: number;
  };

  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    return Response.json({ error: "topic is required" }, { status: 400 });
  }

  const cardCount = Math.min(Math.max(Number(count) || 10, 3), 20);

  const typeInstruction =
    type === "vocab"
      ? `Generate ONLY vocabulary flashcards.`
      : type === "grammar"
        ? `Generate ONLY grammar flashcards.`
        : `Generate a mix of vocabulary and grammar flashcards (roughly 70% vocab, 30% grammar).`;

  const systemPrompt = `You are an expert TOEIC instructor who scored 900+ (Listening & Reading) and 350+ (Speaking & Writing).
You create flashcards for Vietnamese learners preparing for TOEIC.

${typeInstruction}

Generate exactly ${cardCount} flashcards about the topic: "${topic}"

Return ONLY valid JSON matching this schema:
{
  "cards": [
    {
      "type": "vocab",
      "front": "English word or phrase",
      "back": "Vietnamese meaning",
      "phonetic": "/IPA/",
      "partOfSpeech": "noun/verb/adj/adv",
      "level": "B1/B2/C1",
      "example": "Example sentence in TOEIC business context",
      "exampleVi": "Vietnamese translation",
      "toeicTip": "Specific TOEIC tip for this word (which Part, common trap, etc.)"
    },
    {
      "type": "grammar",
      "front": "Grammar structure or formula",
      "back": "Tên cấu trúc bằng tiếng Việt",
      "explanation": "Detailed Vietnamese explanation of usage and rules (2-3 sentences)",
      "example": "Example sentence using this grammar in TOEIC context",
      "exampleVi": "Vietnamese translation",
      "toeicTip": "Specific TOEIC test strategy (Part 5/6 focus, common distractors)"
    }
  ]
}

Rules:
- ALL vocabulary must be TOEIC-relevant (business, office, finance, HR, travel, marketing)
- Examples MUST use workplace/business contexts (emails, meetings, reports, negotiations)
- Grammar cards should focus on structures commonly tested in TOEIC Part 5/6
- TOEIC tips must be specific and actionable (e.g., "Part 5: watch for 'despite' + noun vs 'although' + clause")
- Level should reflect actual CEFR difficulty
- Vietnamese explanations must be clear and concise
- Phonetic transcription must be accurate IPA`;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${cardCount} ${type} flashcards about: ${topic}` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      log.error({ topic, type }, "flashcards.generate.malformed");
      return Response.json({ error: "AI returned malformed content" }, { status: 502 });
    }

    const result = JSON.parse(stripped.slice(start, end + 1));
    return Response.json(result);
  } catch (err) {
    log.error({ err, topic, type }, "flashcards.generate.failed");
    return Response.json({ error: "Flashcard generation failed" }, { status: 502 });
  }
}
