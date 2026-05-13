import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("daily-challenge/explain");

/**
 * POST /api/daily-challenge/explain
 *
 * AI-powered explanation for a daily challenge question.
 * Takes the exercise data and user's answer, returns a concise
 * explanation of why the correct answer is right and the user's answer is wrong.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { exercise, userAnswer, isCorrect } = body;

  if (!exercise) {
    return Response.json({ error: "Missing exercise" }, { status: 400 });
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a concise English tutor for TOEIC learners (Vietnamese).
Give a brief, helpful explanation in Vietnamese (2-4 sentences).
If the user answered correctly, briefly explain the grammar rule or vocabulary point.
If wrong, explain why their answer is wrong and why the correct answer is right.
Include a quick tip or memory aid if helpful.
Format: use simple markdown (bold for key terms). Keep it SHORT.`,
        },
        {
          role: "user",
          content: `Exercise type: ${exercise.type}
Instruction: ${exercise.instruction}
Data: ${JSON.stringify(exercise.data)}
User's answer: "${userAnswer}"
Was correct: ${isCorrect}

Explain briefly in Vietnamese.`,
        },
      ],
    });

    const explanation = completion.choices[0]?.message?.content ?? "";

    return Response.json({ explanation });
  } catch (err) {
    log.error({ err }, "daily-challenge.explain.failed");
    return Response.json({ error: "Failed to generate explanation" }, { status: 502 });
  }
}
