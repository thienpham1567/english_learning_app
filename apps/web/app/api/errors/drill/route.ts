import { db, errorLog } from "@repo/database";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("errors/drill");

/**
 * POST /api/errors/drill
 *
 * AI-powered personalized drill generator.
 * Analyzes the user's most common error patterns and generates
 * targeted practice exercises focused on their weak areas.
 *
 * Returns 10 exercises that specifically target the user's
 * most frequent mistake categories.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { focusTopic } = body; // Optional: specific grammar topic to drill

  // Fetch user's recent unresolved errors (up to 30) to analyze patterns
  const errors = await db
    .select({
      questionStem: errorLog.questionStem,
      userAnswer: errorLog.userAnswer,
      correctAnswer: errorLog.correctAnswer,
      grammarTopic: errorLog.grammarTopic,
      sourceModule: errorLog.sourceModule,
    })
    .from(errorLog)
    .where(
      and(
        eq(errorLog.userId, session.user.id),
        eq(errorLog.isResolved, false),
        focusTopic ? eq(errorLog.grammarTopic, focusTopic) : sql`1=1`,
      ),
    )
    .orderBy(desc(errorLog.createdAt))
    .limit(30);

  if (errors.length < 2) {
    return Response.json({
      error: "Chưa đủ dữ liệu lỗi sai để tạo bài tập. Hãy làm thêm quiz!",
      insufficient: true,
    });
  }

  // Group errors by grammar topic for pattern analysis
  const topicCounts: Record<string, number> = {};
  for (const err of errors) {
    const topic = err.grammarTopic ?? "General";
    topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => `${topic} (${count} lỗi)`);

  // Build the error summary for the AI prompt
  const errorSummary = errors
    .slice(0, 15)
    .map(
      (e) =>
        `• Q: "${e.questionStem}" | User: "${e.userAnswer}" | Correct: "${e.correctAnswer}" | Topic: ${e.grammarTopic ?? "N/A"}`,
    )
    .join("\n");

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a TOEIC tutor creating targeted practice drills.
The student has these weak areas (most errors): ${topTopics.join(", ")}.

Generate exactly 10 exercises that SPECIFICALLY TARGET these weak areas.
Each exercise should address a mistake pattern the student frequently makes.
Mix exercise types for engagement.

Types:
1. "fill-in-blank": sentence with _____ and 4 options (correctIndex 0-3)
2. "error-correction": sentence with error, identify wrong word + correction
3. "word-formation": sentence with _____, provide rootWord + correctAnswer + 4 options

Each exercise MUST include:
- "type": exercise type
- "instruction": in Vietnamese, what to do
- "data": exercise-specific data
- "targetWeakness": which weak area this addresses (in Vietnamese)
- "tip": a brief memory aid or rule reminder (in Vietnamese)

Return JSON: { "exercises": [...], "summary": "Brief analysis of the student's pattern in Vietnamese" }`,
        },
        {
          role: "user",
          content: `Here are the student's recent errors:\n${errorSummary}\n\nGenerate 10 targeted exercises. Return JSON only.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    const DrillResponseSchema = z.object({
      exercises: z
        .array(
          z.object({
            type: z.string(),
            instruction: z.string(),
            data: z.record(z.string(), z.unknown()),
            targetWeakness: z.string(),
            tip: z.string(),
          }),
        )
        .min(1)
        .max(15),
      summary: z.string(),
    });

    const parsed = JSON.parse(content);
    const validated = DrillResponseSchema.safeParse(parsed);

    if (!validated.success) {
      log.warn({ errors: validated.error.flatten() }, "errors.drill.validation.failed");
      return Response.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    return Response.json({
      ...validated.data,
      errorCount: errors.length,
      topTopics,
    });
  } catch (err) {
    log.error({ err }, "errors.drill.generation.failed");
    return Response.json({ error: "Failed to generate drill" }, { status: 502 });
  }
}
