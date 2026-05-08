import { headers } from "next/headers";
import { eq, and, isNotNull, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("daily-challenge/today");
import { dailyChallenge, userStreak, userPreferences } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { ChallengeGenerationSchema } from "@/lib/daily-challenge/schema";
import { getBadges } from "@/lib/daily-challenge/badges";
import { getExamContext } from "@/lib/exam-mode/context";
import type { ExamMode } from "@/components/shared/ExamModeProvider";

function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

type Difficulty = "easy" | "medium" | "hard";

function getDifficultyInstructions(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return `Difficulty: elementary to pre-intermediate (A2-B1). Use simple vocabulary and common sentence structures. Avoid idioms and complex grammar.`;
    case "medium":
      return `Difficulty: intermediate (B1-B2). Use a mix of common and slightly challenging vocabulary. Include some complex sentence structures.`;
    case "hard":
      return `Difficulty: upper-intermediate to advanced (B2-C1). Use sophisticated vocabulary, idioms, and complex grammar structures. Include nuanced distinctions.`;
  }
}

function buildChallengeSystemPrompt(examMode: ExamMode, difficulty: Difficulty): string {
  const ctx = getExamContext(examMode);
  return `You are a daily English challenge generator for ${ctx.label} preparation.
Generate exactly 5 mini-exercises. Pick 3-5 DIFFERENT types from these 9 types for variety:

1. "fill-in-blank": A sentence with _____ and 4 options (correctIndex 0-3)
2. "sentence-order": Scrambled words to arrange into a correct sentence
3. "translation": Vietnamese sentence → provide 1-3 acceptable English translations
4. "error-correction": Sentence with a grammar error, identify the wrong word and its correction
5. "word-formation": A sentence with _____ where the learner must derive the correct form from a root word. Provide rootWord, correctAnswer, and 4 options (correctIndex 0-3)
6. "dialogue-completion": A short 3-4 line conversation with one line missing. Provide context, dialogue array with {speaker, text}, missingIndex, and 4 options (correctIndex 0-3)
7. "synonym-antonym": A word and whether to find its synonym or antonym. Provide word, mode ("synonym" or "antonym"), 4 options (correctIndex 0-3)
8. "reading-comprehension": A 2-3 sentence passage followed by a comprehension question. Provide passage, question, 4 options (correctIndex 0-3)
9. "collocation": A phrase with _____ where the learner picks the word that naturally collocates. Provide phrase, 4 options (correctIndex 0-3), and explanation

Each exercise needs an "instruction" field in Vietnamese telling the learner what to do.
${getDifficultyInstructions(difficulty)}
${ctx.dailyChallengeTopics}

IMPORTANT: Use a variety of types. Do NOT use the same type more than twice. Mix at least 3 different types.

Return ONLY valid JSON:
{
  "exercises": [
    {
      "type": "fill-in-blank",
      "instruction": "Chọn từ đúng để điền vào chỗ trống",
      "data": { "sentence": "She _____ to school every day.", "options": ["go", "goes", "going", "gone"], "correctIndex": 1 }
    },
    {
      "type": "word-formation",
      "instruction": "Chọn dạng đúng của từ gốc để điền vào câu",
      "data": { "sentence": "The _____ of the project was impressive.", "rootWord": "execute", "correctAnswer": "execution", "options": ["executive", "execution", "executing", "executed"], "correctIndex": 1 }
    },
    {
      "type": "dialogue-completion",
      "instruction": "Chọn câu phù hợp để hoàn thành đoạn hội thoại",
      "data": { "context": "At a restaurant", "dialogue": [{"speaker": "Waiter", "text": "Good evening. How many in your party?"}, {"speaker": "Customer", "text": ""}, {"speaker": "Waiter", "text": "Right this way, please."}], "missingIndex": 1, "options": ["Table for two, please.", "I'll have the steak.", "The food was great.", "Where is the exit?"], "correctIndex": 0 }
    },
    {
      "type": "synonym-antonym",
      "instruction": "Chọn từ đồng nghĩa với từ được cho",
      "data": { "word": "abundant", "mode": "synonym", "options": ["scarce", "plentiful", "tiny", "rare"], "correctIndex": 1 }
    },
    {
      "type": "collocation",
      "instruction": "Chọn từ kết hợp tự nhiên nhất",
      "data": { "phrase": "make a _____", "options": ["decision", "opinion", "thought", "idea"], "correctIndex": 0, "explanation": "'Make a decision' is a common English collocation. We say 'form an opinion', 'have a thought', and 'have an idea'." }
    }
  ]
}`;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vnToday = getVnDate();

  // Fire the three independent reads in parallel instead of sequentially.
  const [prefRows, existing, streakRows] = await Promise.all([
    db
      .select({ examMode: userPreferences.examMode })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1),
    db
      .select()
      .from(dailyChallenge)
      .where(
        and(eq(dailyChallenge.userId, session.user.id), eq(dailyChallenge.challengeDate, vnToday)),
      )
      .limit(1),
    db
      .select()
      .from(userStreak)
      .where(eq(userStreak.userId, session.user.id))
      .limit(1),
  ]);

  const examMode: ExamMode = (prefRows[0]?.examMode as ExamMode) ?? "toeic";

  const streak = streakRows[0] ?? {
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
  };

  const badges = getBadges(streak.bestStreak);

  if (existing[0]) {
    const row = existing[0];
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
      streak: {
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        lastCompletedDate: streak.lastCompletedDate,
      },
      badges,
    });
  }

  // ── Adaptive difficulty: query last 7 completed challenges ──
  let difficulty: Difficulty = "medium";
  try {
    const recentScores = await db
      .select({ score: dailyChallenge.score })
      .from(dailyChallenge)
      .where(
        and(
          eq(dailyChallenge.userId, session.user.id),
          isNotNull(dailyChallenge.completedAt),
        ),
      )
      .orderBy(desc(dailyChallenge.challengeDate))
      .limit(7);

    if (recentScores.length >= 3) {
      const avgScore =
        recentScores.reduce((s, r) => s + (r.score ?? 0), 0) / recentScores.length;
      difficulty = avgScore >= 4.0 ? "hard" : avgScore >= 2.5 ? "medium" : "easy";
    }
  } catch (err) {
    log.warn({ err }, "daily-challenge.difficulty.query.failed");
    // Non-fatal — use default medium
  }

  // Generate new challenge via AI
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildChallengeSystemPrompt(examMode, difficulty) },
          {
            role: "user",
            content: `Generate today's daily English challenge. Date: ${vnToday}. Difficulty: ${difficulty}. Return JSON only.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const json = JSON.parse(content);
      const validated = ChallengeGenerationSchema.safeParse(json);

      if (validated.success) {
        const [row] = await db
          .insert(dailyChallenge)
          .values({
            userId: session.user.id,
            challengeDate: vnToday,
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
          streak: {
            currentStreak: streak.currentStreak,
            bestStreak: streak.bestStreak,
            lastCompletedDate: streak.lastCompletedDate,
          },
          badges,
        });
      }

      log.warn({ attempt: attempt + 1, errors: validated.error.flatten() }, "daily-challenge.generate.validation.failed");
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "daily-challenge.generate.failed");
    }
  }

  return Response.json({ error: "Failed to generate challenge" }, { status: 502 });
}
