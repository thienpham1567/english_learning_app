import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("daily-challenge/bonus");
import { dailyChallenge, userPreferences } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { ChallengeGenerationSchema } from "@/lib/daily-challenge/schema";
import { getExamContext } from "@/lib/exam-mode/context";
import type { ExamMode } from "@/components/shared/ExamModeProvider";

function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function buildBonusPrompt(examMode: ExamMode): string {
  const ctx = getExamContext(examMode);
  return `You are a bonus English challenge generator for ${ctx.label} preparation.
Generate exactly 3 bonus exercises. Pick 3 DIFFERENT types from these 9 types:

1. "fill-in-blank": A sentence with _____ and 4 options (correctIndex 0-3)
2. "sentence-order": Scrambled words to arrange into a correct sentence
3. "translation": Vietnamese sentence → provide 1-3 acceptable English translations
4. "error-correction": Sentence with a grammar error, identify the wrong word and its correction
5. "word-formation": A sentence with _____ where the learner must derive the correct form from a root word. Provide rootWord, correctAnswer, and 4 options (correctIndex 0-3)
6. "dialogue-completion": A short 3-4 line conversation with one line missing. Provide context, dialogue array with {speaker, text}, missingIndex, and 4 options (correctIndex 0-3)
7. "synonym-antonym": A word and whether to find its synonym or antonym. Provide word, mode ("synonym" or "antonym"), 4 options (correctIndex 0-3)
8. "reading-comprehension": A 2-3 sentence passage followed by a comprehension question. Provide passage, question, 4 options (correctIndex 0-3)
9. "collocation": A phrase with _____ where the learner picks the word that naturally collocates. Provide phrase, 4 options (correctIndex 0-3), and explanation

Each exercise needs an "instruction" field in Vietnamese.
Difficulty: intermediate (B1-B2). ${ctx.dailyChallengeTopics}
IMPORTANT: Use 3 DIFFERENT types for variety.

Return ONLY valid JSON:
{
  "exercises": [ ... ]
}`;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vnToday = getVnDate();

  // Check daily challenge is completed first
  const [dailyRows, bonusRows, prefRows] = await Promise.all([
    db
      .select({ completedAt: dailyChallenge.completedAt })
      .from(dailyChallenge)
      .where(
        and(
          eq(dailyChallenge.userId, session.user.id),
          eq(dailyChallenge.challengeDate, vnToday),
        ),
      )
      .limit(1),
    db
      .select()
      .from(dailyChallenge)
      .where(
        and(
          eq(dailyChallenge.userId, session.user.id),
          eq(dailyChallenge.challengeDate, `${vnToday}-bonus`),
        ),
      )
      .limit(1),
    db
      .select({ examMode: userPreferences.examMode })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1),
  ]);

  // Must complete daily first
  if (!dailyRows[0]?.completedAt) {
    return Response.json(
      { error: "Complete today's daily challenge first" },
      { status: 409 },
    );
  }

  // Already have bonus for today
  if (bonusRows[0]) {
    const row = bonusRows[0];
    return Response.json({
      challenge: {
        id: row.id,
        challengeDate: row.challengeDate,
        exercises: row.exercises,
        answers: row.answers,
        score: row.score,
        completedAt: row.completedAt?.toISOString() ?? null,
        timeElapsedMs: row.timeElapsedMs,
      },
    });
  }

  const examMode: ExamMode = (prefRows[0]?.examMode as ExamMode) ?? "toeic";

  // Generate bonus via AI
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildBonusPrompt(examMode) },
          {
            role: "user",
            content: `Generate a bonus round. Date: ${vnToday}. Return JSON only.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const json = JSON.parse(content);
      const validated = ChallengeGenerationSchema.safeParse(json);

      if (validated.success) {
        // Store with "-bonus" suffix on date to differentiate
        const [row] = await db
          .insert(dailyChallenge)
          .values({
            userId: session.user.id,
            challengeDate: `${vnToday}-bonus`,
            exercises: validated.data.exercises,
          })
          .returning();

        return Response.json({
          challenge: {
            id: row.id,
            challengeDate: row.challengeDate,
            exercises: row.exercises,
            answers: null,
            score: null,
            completedAt: null,
            timeElapsedMs: null,
          },
        });
      }

      log.warn({ attempt: attempt + 1, errors: validated.error.flatten() }, "bonus.generate.validation.failed");
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "bonus.generate.failed");
    }
  }

  return Response.json({ error: "Failed to generate bonus round" }, { status: 502 });
}
