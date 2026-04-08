import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { QuizGenerationResponseSchema } from "@/lib/grammar-quiz/schema";

const RequestBodySchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  count: z.number().int().min(1).max(20).default(10),
});

const SYSTEM_PROMPT = `You are a grammar quiz generator for English learners.
Generate multiple-choice questions testing specific grammar points appropriate for the given CEFR level.
Each question must have exactly 4 options with exactly one correct answer.
The explanation should include both English grammar rule and Vietnamese translation.

IMPORTANT: Return ONLY valid JSON matching this exact schema:
{
  "questions": [
    {
      "stem": "She _____ to the store yesterday.",
      "options": ["go", "goes", "went", "going"],
      "correctIndex": 2,
      "explanation": "We use the past simple tense for completed actions in the past. 'Yesterday' is a past time marker.\\nChúng ta dùng thì quá khứ đơn cho hành động đã hoàn thành trong quá khứ. 'Yesterday' là dấu hiệu thời gian quá khứ.",
      "grammarTopic": "past simple"
    }
  ]
}`;

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
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { level, count } = parsed.data;

  // Try up to 2 times to get valid output from AI
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate exactly ${count} grammar quiz questions for CEFR level ${level}. Return JSON only.`,
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
        return Response.json({ questions: validated.data.questions });
      }

      // Invalid format — retry
      console.warn(
        `[grammar-quiz] AI output validation failed (attempt ${attempt + 1}):`,
        validated.error.flatten(),
      );
    } catch (err) {
      console.error(`[grammar-quiz] AI call failed (attempt ${attempt + 1}):`, err);
    }
  }

  return Response.json(
    { error: "Failed to generate quiz. Please try again." },
    { status: 502 },
  );
}
