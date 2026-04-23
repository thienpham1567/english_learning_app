import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { errorLog } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * Deep Explanation response shape — structured analysis of why the user got it wrong.
 */
const DeepExplanationSchema = z.object({
  whyWrong: z.string(),
  whyCorrect: z.string(),
  grammarRule: z.string(),
  examples: z.array(z.string()).min(1).max(5),
  tip: z.string(),
});

type DeepExplanation = z.infer<typeof DeepExplanationSchema>;

function buildDeepExplainPrompt(
  questionStem: string,
  userAnswer: string,
  correctAnswer: string,
  grammarTopic: string | null,
): string {
  return `You are an expert English grammar tutor helping a Vietnamese TOEIC/IELTS learner understand their mistake.

## The Error
- **Question/Sentence**: ${questionStem}
- **Student answered**: "${userAnswer}" (WRONG)
- **Correct answer**: "${correctAnswer}"
${grammarTopic ? `- **Grammar topic**: ${grammarTopic}` : ""}

## Your Task
Provide a detailed, structured explanation in Vietnamese. Be specific to THIS exact error — do not give generic explanations.

Return ONLY valid JSON matching this exact schema:
{
  "whyWrong": "Giải thích cụ thể tại sao đáp án '${userAnswer}' là sai trong ngữ cảnh này. Phân tích logic sai của học viên. Nếu đáp án sai vì ngữ pháp, chỉ ra lỗi ngữ pháp cụ thể. Nếu sai vì nghĩa, giải thích tại sao nghĩa không phù hợp. (2-4 câu)",
  "whyCorrect": "Giải thích chi tiết tại sao '${correctAnswer}' là đáp án đúng. Nêu rõ quy tắc ngữ pháp áp dụng, signal words trong câu, và cách nhận biết. (2-4 câu)",
  "grammarRule": "Tóm tắt quy tắc ngữ pháp liên quan dưới dạng công thức/pattern ngắn gọn. Ví dụ: 'S + had + V3/Ved + before + S + V2/Ved' hoặc 'despite + N/V-ing'",
  "examples": ["2-3 câu ví dụ minh họa quy tắc này trong ngữ cảnh tương tự, mỗi câu kèm bản dịch tiếng Việt ngắn"],
  "tip": "Mẹo ghi nhớ ngắn gọn, dễ nhớ để không mắc lỗi này nữa (1-2 câu)"
}`;
}

/**
 * POST /api/errors/[id]/explain
 *
 * Generate (or return cached) deep explanation for an error.
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

  // Fetch the error entry
  const [entry] = await db
    .select()
    .from(errorLog)
    .where(and(eq(errorLog.id, id), eq(errorLog.userId, session.user.id)))
    .limit(1);

  if (!entry) {
    return Response.json({ error: "Error not found" }, { status: 404 });
  }

  // Return cached deep explanation if available
  if (entry.deepExplanation) {
    return Response.json({ explanation: entry.deepExplanation, cached: true });
  }

  // Generate via LLM
  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildDeepExplainPrompt(
            entry.questionStem,
            entry.userAnswer,
            entry.correctAnswer,
            entry.grammarTopic,
          ),
        },
        {
          role: "user",
          content: "Hãy phân tích lỗi sai này chi tiết. Return JSON only.",
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    const json = JSON.parse(content);
    const validated = DeepExplanationSchema.safeParse(json);

    if (!validated.success) {
      console.warn("[errors/explain] AI output validation failed:", validated.error.flatten());
      return Response.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const explanation: DeepExplanation = validated.data;

    // Cache into DB (fire-and-forget)
    void db
      .update(errorLog)
      .set({ deepExplanation: explanation })
      .where(eq(errorLog.id, id))
      .catch((err) => console.error("[errors/explain] Cache write failed:", err));

    return Response.json({ explanation, cached: false });
  } catch (err) {
    console.error("[errors/explain] LLM call failed:", err);
    return Response.json({ error: "Failed to generate explanation" }, { status: 502 });
  }
}
