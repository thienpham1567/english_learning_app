import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { dailyChallenge, userStreak, userPreferences } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { ChallengeGenerationSchema } from "@/lib/daily-challenge/schema";
import { getBadges } from "@/lib/daily-challenge/badges";
import { getExamContext } from "@/lib/exam-mode/context";
import type { ExamMode } from "@/components/app/shared/ExamModeProvider";

function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function buildChallengeSystemPrompt(examMode: ExamMode): string {
  const ctx = getExamContext(examMode);
  return `You are a daily English challenge generator for ${ctx.label} preparation.
Generate exactly 5 mini-exercises mixing 2-3 of these types:

1. "fill-in-blank": A sentence with _____ and 4 options (correctIndex 0-3)
2. "sentence-order": Scrambled words to arrange into a correct sentence
3. "translation": Vietnamese sentence → provide 1-3 acceptable English translations
4. "error-correction": Sentence with a grammar error, identify the wrong word and its correction

Each exercise needs an "instruction" field in Vietnamese telling the learner what to do.
Difficulty: intermediate (B1-B2). ${ctx.dailyChallengeTopics}

Return ONLY valid JSON:
{
  "exercises": [
    {
      "type": "fill-in-blank",
      "instruction": "Chọn từ đúng để điền vào chỗ trống",
      "data": { "sentence": "She _____ to school every day.", "options": ["go", "goes", "going", "gone"], "correctIndex": 1 }
    },
    {
      "type": "sentence-order",
      "instruction": "Sắp xếp các từ thành câu đúng",
      "data": { "scrambled": ["the", "cat", "on", "sat", "mat", "the"], "correctOrder": ["the", "cat", "sat", "on", "the", "mat"] }
    },
    {
      "type": "translation",
      "instruction": "Dịch câu sau sang tiếng Anh",
      "data": { "vietnamese": "Tôi thích đọc sách.", "acceptableAnswers": ["I like reading books.", "I enjoy reading books."] }
    },
    {
      "type": "error-correction",
      "instruction": "Tìm và sửa lỗi sai trong câu",
      "data": { "sentence": "She don't like coffee.", "errorWord": "don't", "correction": "doesn't", "explanation": "Third person singular requires 'doesn't'." }
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

  // Fetch user's exam mode preference
  const prefRows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);
  const examMode: ExamMode = (prefRows[0]?.examMode as ExamMode) ?? "toeic";

  // Check if today's challenge already exists
  const existing = await db
    .select()
    .from(dailyChallenge)
    .where(
      and(eq(dailyChallenge.userId, session.user.id), eq(dailyChallenge.challengeDate, vnToday)),
    )
    .limit(1);

  // Get streak info
  const streakRows = await db
    .select()
    .from(userStreak)
    .where(eq(userStreak.userId, session.user.id))
    .limit(1);

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

  // Generate new challenge via AI
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildChallengeSystemPrompt(examMode) },
          {
            role: "user",
            content: `Generate today's daily English challenge. Date: ${vnToday}. Return JSON only.`,
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

      console.warn(
        `[daily-challenge] AI validation failed (attempt ${attempt + 1}):`,
        validated.error.flatten(),
      );
    } catch (err) {
      console.error(`[daily-challenge] Generation failed (attempt ${attempt + 1}):`, err);
    }
  }

  return Response.json({ error: "Failed to generate challenge" }, { status: 502 });
}
