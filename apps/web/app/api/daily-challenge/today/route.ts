import { db } from "@repo/database";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("daily-challenge/today");

import { dailyChallenge, userPreferences, userStreak } from "@repo/database";
import { getBadges } from "@/lib/daily-challenge/badges";
import { normalizeChallenge } from "@/lib/daily-challenge/normalize";
import { type ExamModeValue, getExamContext } from "@/lib/exam-mode/context";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { extractJson } from "@/lib/openai/extract-json";

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

/**
 * Extract key content stems from past exercises to prevent repetition.
 * Returns a compact list of sentences/words/passages from recent challenges.
 */
function extractRecentStems(exercises: Record<string, unknown>[]): string[] {
  const stems: string[] = [];
  for (const ex of exercises) {
    const data = ex.data as Record<string, unknown> | undefined;
    if (!data) continue;
    // Pull the most identifying field from each exercise type
    if (typeof data.sentence === "string") stems.push(data.sentence);
    if (typeof data.vietnamese === "string") stems.push(data.vietnamese);
    if (typeof data.word === "string") stems.push(data.word as string);
    if (typeof data.phrase === "string") stems.push(data.phrase);
    if (typeof data.passage === "string") stems.push((data.passage as string).slice(0, 80));
    if (typeof data.rootWord === "string") stems.push(data.rootWord);
    if (typeof data.context === "string") stems.push(data.context);
    if (Array.isArray(data.correctOrder)) stems.push((data.correctOrder as string[]).join(" "));
  }
  return stems;
}

function buildChallengeSystemPrompt(
  examMode: ExamModeValue,
  difficulty: Difficulty,
  recentStems: string[],
): string {
  const ctx = getExamContext(examMode);

  const antiRepetitionBlock =
    recentStems.length > 0
      ? `\n\nCRITICAL — ANTI-REPETITION RULE:\nThe following sentences, words, and phrases were ALREADY used in recent challenges. You MUST NOT reuse them or create minor variations of them. Generate completely NEW and DIFFERENT content:\n---\n${recentStems.join("\n")}\n---\nCreate fresh sentences with different vocabulary, different grammar points, and different scenarios. Be creative and surprising.`
      : "";

  if (examMode === "toeic") {
    return `You are a professional TOEIC daily challenge designer creating a mixed-skill warm-up set.
Generate exactly 10 mini-exercises. Use 5-9 DIFFERENT types from the 9 types below for variety.
Do NOT use the same type more than 3 times.

${getDifficultyInstructions(difficulty)}

═══════════════════════════════════════════════
EXERCISE TYPE SPECIFICATIONS
═══════════════════════════════════════════════

1. "fill-in-blank" — TOEIC Part 5 style
   Sentence with _____ and 4 options. Tests grammar or vocabulary in business context.
   DISTRACTOR RULES: All 4 options must be the same part of speech or closely related word forms.
   Example:
   { "type": "fill-in-blank", "instruction": "Chọn từ đúng để điền vào chỗ trống",
     "data": { "sentence": "All employees must _____ the safety training by the end of the month.", "options": ["complete", "completion", "completely", "completed"], "correctIndex": 0 } }

2. "sentence-order" — Tests natural English word order
   Provide 5-8 scrambled words/phrases to arrange into a correct TOEIC-style business sentence.
   Example:
   { "type": "sentence-order", "instruction": "Sắp xếp các từ thành câu hoàn chỉnh",
     "data": { "scrambled": ["the meeting", "has been", "until", "postponed", "next Monday"], "correctOrder": ["the meeting", "has been", "postponed", "until", "next Monday"] } }

3. "translation" — Vietnamese → English business sentences
   Provide a Vietnamese sentence and 1-3 acceptable English translations. Use TOEIC business contexts.
   Example:
   { "type": "translation", "instruction": "Dịch câu sau sang tiếng Anh",
     "data": { "vietnamese": "Cuộc họp đã bị hoãn lại đến tuần sau.", "acceptableAnswers": ["The meeting has been postponed until next week.", "The meeting was postponed to next week."] } }

4. "error-correction" — Find and fix the grammar error
   A sentence with ONE grammar error common in TOEIC. Identify the wrong word and provide correction + explanation.
   Example:
   { "type": "error-correction", "instruction": "Tìm từ sai trong câu và sửa lại",
     "data": { "sentence": "The sales team have already submited their quarterly reports.", "errorWord": "submited", "correction": "submitted", "explanation": "The past participle of 'submit' is 'submitted' (double t)." } }

5. "word-formation" — Derive correct word form from root (TOEIC Part 5 pattern)
   A sentence with _____ where the learner picks the correct derived form. Show the rootWord.
   DISTRACTOR RULES: All 4 options must be different forms of the SAME root word (noun/verb/adj/adv).
   Example:
   { "type": "word-formation", "instruction": "Chọn dạng đúng của từ gốc để điền vào câu",
     "data": { "sentence": "The company's _____ strategy led to a 20% increase in revenue.", "rootWord": "market", "correctAnswer": "marketing", "options": ["market", "marketing", "marketed", "marketable"], "correctIndex": 1 } }

6. "dialogue-completion" — Complete a workplace conversation
   A 3-4 line dialogue with one missing line. Context must be a TOEIC scenario.
   Example:
   { "type": "dialogue-completion", "instruction": "Chọn câu phù hợp để hoàn thành đoạn hội thoại",
     "data": { "context": "At a client meeting", "dialogue": [{"speaker": "Manager", "text": "I'd like to discuss the timeline for the project."}, {"speaker": "Client", "text": ""}, {"speaker": "Manager", "text": "That works for us. Let's aim for March then."}], "missingIndex": 1, "options": ["We're hoping to launch by the end of Q1.", "The weather has been nice lately.", "I had pasta for lunch.", "My car broke down yesterday."], "correctIndex": 0 } }

7. "synonym-antonym" — Vocabulary breadth (TOEIC Part 5/7 vocabulary)
   Test business/professional vocabulary. Word should be from TOEIC high-frequency word lists.
   Example:
   { "type": "synonym-antonym", "instruction": "Chọn từ trái nghĩa với từ được cho",
     "data": { "word": "mandatory", "mode": "antonym", "options": ["optional", "required", "essential", "compulsory"], "correctIndex": 0 } }

8. "reading-comprehension" — Mini TOEIC Part 7 passage
   A 2-3 sentence business passage + one comprehension question with 4 options.
   Passage types: email excerpt, announcement, advertisement, article snippet, notice.
   Example:
   { "type": "reading-comprehension", "instruction": "Đọc đoạn văn và trả lời câu hỏi",
     "data": { "passage": "Due to renovations, the employee cafeteria on the 3rd floor will be closed from March 10-15. During this time, staff are encouraged to use the café on the 1st floor or nearby restaurants.", "question": "What is the purpose of this notice?", "options": ["To announce a new restaurant", "To inform about a temporary closure", "To invite staff to a party", "To describe a new menu"], "correctIndex": 1 } }

9. "collocation" — Natural word partnerships (TOEIC high-frequency)
   A phrase with _____ where the learner picks the naturally collocating word.
   Focus on TOEIC business collocations: make/do/take/have/give + noun patterns.
   Example:
   { "type": "collocation", "instruction": "Chọn từ kết hợp tự nhiên nhất",
     "data": { "phrase": "take _____ of the situation", "options": ["advantage", "benefit", "profit", "gain"], "correctIndex": 0, "explanation": "'Take advantage of' is a fixed collocation meaning to use an opportunity. 'Benefit from', 'profit from', and 'gain from' use different prepositions." } }

═══════════════════════════════════════════════
TOEIC CONTEXT & VOCABULARY DOMAINS
═══════════════════════════════════════════════
Rotate through these topics (never repeat same sub-topic within one challenge set):
- Corporate: meetings, memos, reports, budgets, presentations, deadlines
- HR: hiring, training, performance reviews, benefits, promotions, resignations
- Sales & Marketing: campaigns, product launches, customer feedback, market research
- Travel & Hospitality: reservations, itineraries, airport announcements, hotel services
- Finance: invoices, expenses, quarterly earnings, audit, tax filings
- Operations: supply chain, manufacturing, quality control, inventory, shipping
- Technology: system upgrades, IT support, software training, data security
- Customer Service: complaints, refunds, warranties, satisfaction surveys
- Events: conferences, trade shows, company outings, award ceremonies

═══════════════════════════════════════════════
INSTRUCTION LANGUAGE
═══════════════════════════════════════════════
- "instruction" field: ALWAYS in Vietnamese
- All exercise content (sentences, options, passages, dialogues): ALWAYS in English
- Exception: "translation" type has Vietnamese source sentence
${antiRepetitionBlock}

Return ONLY valid JSON with the key "exercises":
{
  "exercises": [ /* exactly 10 exercise objects */ ]
}`;
  }

  // IELTS/generic fallback
  return `You are a daily English challenge generator for ${ctx.label} preparation.
Generate exactly 10 mini-exercises. Pick 5-9 DIFFERENT types from these 9 types for variety:

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

IMPORTANT: Use a variety of types. Do NOT use the same type more than 3 times. Mix at least 5 different types across the 10 exercises.
${antiRepetitionBlock}

Return ONLY valid JSON with the key "exercises":
{
  "exercises": [
    {
      "type": "fill-in-blank",
      "instruction": "Chọn từ đúng để điền vào chỗ trống",
      "data": { "sentence": "She _____ to school every day.", "options": ["go", "goes", "going", "gone"], "correctIndex": 1 }
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
    db.select().from(userStreak).where(eq(userStreak.userId, session.user.id)).limit(1),
  ]);

  const examMode: ExamModeValue = (prefRows[0]?.examMode as ExamModeValue) ?? "toeic";

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

  // ── Adaptive difficulty + deduplication: query last 14 completed challenges ──
  let difficulty: Difficulty = "medium";
  let recentStems: string[] = [];
  try {
    const recentChallenges = await db
      .select({ score: dailyChallenge.score, exercises: dailyChallenge.exercises })
      .from(dailyChallenge)
      .where(
        and(
          eq(dailyChallenge.userId, session.user.id),
          isNotNull(dailyChallenge.completedAt),
          // Exclude bonus rows from stem extraction
          ne(dailyChallenge.challengeDate, `${vnToday}-bonus`),
        ),
      )
      .orderBy(desc(dailyChallenge.challengeDate))
      .limit(14);

    // Adaptive difficulty from the 7 most recent scores
    const recentScores = recentChallenges.slice(0, 7);
    if (recentScores.length >= 3) {
      const avgScore = recentScores.reduce((s, r) => s + (r.score ?? 0), 0) / recentScores.length;
      difficulty = avgScore >= 4.0 ? "hard" : avgScore >= 2.5 ? "medium" : "easy";
    }

    // Extract stems from all 14 recent challenges for deduplication
    for (const row of recentChallenges) {
      const exercises = row.exercises as Record<string, unknown>[];
      if (Array.isArray(exercises)) {
        recentStems.push(...extractRecentStems(exercises));
      }
    }
    // Cap at 100 stems to keep prompt size manageable
    if (recentStems.length > 100) {
      recentStems = recentStems.slice(0, 100);
    }
  } catch (err) {
    log.warn({ err }, "daily-challenge.difficulty.query.failed");
    // Non-fatal — use default medium and no dedup
  }

  // ── Rotating daily topic for guaranteed variety ──
  const DAILY_TOPICS = [
    "office meetings and scheduling",
    "hiring and job interviews",
    "product launches and marketing campaigns",
    "hotel reservations and travel itineraries",
    "financial reports and quarterly earnings",
    "supply chain and manufacturing",
    "IT support and system upgrades",
    "customer complaints and refunds",
    "conferences and trade shows",
    "performance reviews and promotions",
    "contract negotiations and legal terms",
    "training workshops and onboarding",
    "shipping and logistics coordination",
    "company announcements and policy changes",
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const todayTopic = DAILY_TOPICS[dayOfYear % DAILY_TOPICS.length];

  // Generate new challenge via AI
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildChallengeSystemPrompt(examMode, difficulty, recentStems),
          },
          {
            role: "user",
            content: `Generate today's daily English challenge with exactly 10 exercises.
Date: ${vnToday}
Difficulty: ${difficulty}
Today's primary topic focus: "${todayTopic}" — at least 4-5 exercises should revolve around this theme.
The remaining exercises should cover OTHER topics for variety.

CRITICAL: Every sentence, passage, and word must be BRAND NEW content never seen before. Do NOT recycle generic textbook examples. Create realistic, specific scenarios with concrete details (names, dates, numbers, locations).

Return JSON only, with a top-level "exercises" array.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const raw = extractJson(content) as Record<string, unknown>;
      const result = normalizeChallenge(raw);

      if (!result) {
        log.warn(
          { attempt: attempt + 1, keys: Object.keys(raw) },
          "daily-challenge.generate.normalize.failed",
        );
        continue;
      }

      if (result.dropped > 0) {
        log.info(
          { attempt: attempt + 1, kept: result.exercises.length, dropped: result.dropped },
          "daily-challenge.generate.partial",
        );
      }

      const [row] = await db
        .insert(dailyChallenge)
        .values({
          userId: session.user.id,
          challengeDate: vnToday,
          exercises: result.exercises,
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
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "daily-challenge.generate.failed");
    }
  }

  return Response.json({ error: "Failed to generate challenge" }, { status: 502 });
}
