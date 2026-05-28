import { db, errorLog } from "@repo/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("errors/to-flashcard");

/**
 * POST /api/errors/[id]/to-flashcard
 *
 * Generates a focused flashcard from an error entry using AI.
 * Returns the flashcard data (front/back/example/tip).
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
  const userId = session.user!.id;

  // Fetch the error entry
  const [entry] = await db
    .select()
    .from(errorLog)
    .where(eq(errorLog.id, id))
    .limit(1);

  if (!entry || entry.userId !== userId) {
    return Response.json({ error: "Error not found" }, { status: 404 });
  }

  const optionsText =
    entry.options && Array.isArray(entry.options)
      ? `Options: ${(entry.options as string[]).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ")}`
      : "";

  const systemPrompt = `You are an expert TOEIC tutor creating a flashcard from a student's mistake.
The student got this question wrong. Create a focused flashcard that helps them master the concept.

Question: ${entry.questionStem}
${optionsText}
Student's answer: ${entry.userAnswer}
Correct answer: ${entry.correctAnswer}
${entry.grammarTopic ? `Grammar topic: ${entry.grammarTopic}` : ""}
${entry.explanationEn ? `Explanation: ${entry.explanationEn}` : ""}

Return ONLY valid JSON:
{
  "front": "The grammar rule, structure, or vocabulary item to learn (concise, in English)",
  "back": "Vietnamese explanation of the concept (clear, 1-2 sentences)",
  "example": "A TOEIC-style example sentence demonstrating correct usage",
  "exampleVi": "Vietnamese translation of the example",
  "tip": "A specific TOEIC exam tip to avoid this mistake (1 sentence, actionable)",
  "type": "grammar"
}

Rules:
- Front should be the KEY concept (not the full question)
- Back must be in Vietnamese
- Example must be different from the original question
- Tip should be TOEIC-specific and actionable`;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the flashcard." },
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
      log.error({ id }, "to-flashcard.malformed");
      return Response.json({ error: "AI returned malformed content" }, { status: 502 });
    }

    const card = JSON.parse(stripped.slice(start, end + 1));

    // Attach source error metadata
    card.sourceErrorId = id;
    card.sourceModule = entry.sourceModule;
    card.createdFrom = "error-notebook";

    return Response.json(card);
  } catch (err) {
    log.error({ err, id }, "to-flashcard.failed");
    return Response.json({ error: "Flashcard generation failed" }, { status: 502 });
  }
}
