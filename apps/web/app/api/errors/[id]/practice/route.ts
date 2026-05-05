import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("errors/[id]/practice");
import { errorLog } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const PracticeSchema = z.object({
  questionStem: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
});

type Practice = z.infer<typeof PracticeSchema>;

/**
 * POST /api/errors/[id]/practice
 *
 * Generate a new practice question based on the same grammar pattern as the error.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [entry] = await db
    .select()
    .from(errorLog)
    .where(and(eq(errorLog.id, id), eq(errorLog.userId, session.user.id)))
    .limit(1);

  if (!entry) {
    return Response.json({ error: "Error not found" }, { status: 404 });
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an English grammar exercise generator for a Vietnamese learner.

## Original Error
- **Question**: ${entry.questionStem}
- **Wrong answer**: "${entry.userAnswer}"
- **Correct answer**: "${entry.correctAnswer}"
${entry.grammarTopic ? `- **Grammar topic**: ${entry.grammarTopic}` : ""}

## Your Task
Create a NEW, DIFFERENT practice question that tests the SAME grammar pattern/rule.
The question must be different from the original but test the same concept.
Write the question stem in English. Write the explanation in Vietnamese.

Return ONLY valid JSON:
{
  "questionStem": "A new fill-in-the-blank or multiple choice question testing the same grammar rule",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Giải thích ngắn gọn bằng tiếng Việt tại sao đáp án đúng (1-2 câu)"
}`,
        },
        {
          role: "user",
          content: "Generate a new practice question. Return JSON only.",
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    const parsed = PracticeSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return Response.json({ error: "Invalid AI response" }, { status: 502 });
    }

    return Response.json({ practice: parsed.data });
  } catch (err) {
    log.error({ err }, "errors.practice.llm.failed");
    return Response.json({ error: "Failed to generate practice" }, { status: 502 });
  }
}
