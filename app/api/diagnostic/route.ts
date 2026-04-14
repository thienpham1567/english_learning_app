import { headers } from "next/headers";
import { eq, desc, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { diagnosticResult, userSkillProfile, activityLog } from "@/lib/db/schema";
import { createInitialState, processAnswer, calculateResults, type SkillState } from "@/lib/diagnostic/algorithm";
import { getQuestionsForLevel, generateTestPlan, getQuestionById } from "@/lib/diagnostic/questions";
import { CEFR_LEVELS, type DiagnosticSkill, type DiagnosticAnswer, type CefrLevel } from "@/lib/diagnostic/types";

/**
 * GET /api/diagnostic
 *
 * Returns the user's diagnostic status:
 * - lastResult (if any)
 * - canRetake (30-day cooldown)
 * - daysUntilRetake
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [lastResult] = await db
    .select()
    .from(diagnosticResult)
    .where(eq(diagnosticResult.userId, userId))
    .orderBy(desc(diagnosticResult.completedAt))
    .limit(1);

  let canRetake = true;
  let daysUntilRetake = 0;

  if (lastResult) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastResult.completedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince < 30) {
      canRetake = false;
      daysUntilRetake = 30 - daysSince;
    }
  }

  return Response.json({
    lastResult: lastResult
      ? {
          overallCefr: lastResult.overallCefr,
          confidence: lastResult.confidence,
          skillBreakdown: lastResult.skillBreakdown,
          completedAt: lastResult.completedAt,
        }
      : null,
    canRetake,
    daysUntilRetake,
    hasResult: !!lastResult,
  });
}

/**
 * POST /api/diagnostic
 *
 * Runs the full diagnostic test server-side.
 * Body: { answers: Array<{ questionId, selectedIndex, timeMs }> }
 *
 * For the MVP, we generate questions server-side, send them all at once,
 * then process all answers in a single request for simplicity.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();

  // ── Mode: "generate" — returns all questions for the test ──
  if (body.action === "generate") {
    // Check cooldown
    const [lastResult] = await db
      .select({ completedAt: diagnosticResult.completedAt })
      .from(diagnosticResult)
      .where(eq(diagnosticResult.userId, userId))
      .orderBy(desc(diagnosticResult.completedAt))
      .limit(1);

    if (lastResult) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastResult.completedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < 30) {
        return Response.json(
          { error: "Cooldown active", daysUntilRetake: 30 - daysSince },
          { status: 429 },
        );
      }
    }

    // Generate questions for each skill at B1 starting level
    const plan = generateTestPlan();
    const states = createInitialState();
    const usedIds = new Set<string>();
    const questions: Array<{
      id: string;
      skill: DiagnosticSkill;
      level: CefrLevel;
      question: string;
      options: string[];
      index: number;
    }> = [];

    for (let i = 0; i < plan.length; i++) {
      const skill = plan[i];
      const levelIndex = states[skill].currentLevelIndex;
      const targetLevel = CEFR_LEVELS[levelIndex];

      const [q] = getQuestionsForLevel(skill, targetLevel, 1, usedIds);
      if (q) {
        usedIds.add(q.id);
        questions.push({
          id: q.id,
          skill: q.skill,
          level: q.level,
          question: q.question,
          options: q.options,
          index: i,
        });

        // Simulate adaptive: we can't know answers yet, so just use initial level
        // Real adaptation happens during submission
      }
    }

    return Response.json({ questions, total: questions.length });
  }

  // ── Mode: "submit" — processes all answers and saves results ──
  if (body.action === "submit") {
    const answers: Array<{
      questionId: string;
      selectedIndex: number;
      timeMs: number;
    }> = body.answers;

    if (!Array.isArray(answers) || answers.length === 0) {
      return Response.json({ error: "No answers provided" }, { status: 400 });
    }

    // F1 fix: Match answers by questionId (deterministic) instead of regenerating
    const states = createInitialState();
    const processedAnswers: DiagnosticAnswer[] = [];

    for (const userAnswer of answers) {
      const q = getQuestionById(userAnswer.questionId);
      if (!q) continue; // skip unknown question IDs

      const correct = userAnswer.selectedIndex === q.correctIndex;
      const skill = q.skill as DiagnosticSkill;

      const answer: DiagnosticAnswer = {
        questionId: q.id,
        skill,
        level: q.level,
        selectedIndex: userAnswer.selectedIndex,
        correct,
        timeMs: userAnswer.timeMs,
      };

      processedAnswers.push(answer);
      processAnswer(states[skill], answer);
    }

    // Calculate results
    const results = calculateResults(states, processedAnswers);

    // Save to diagnostic_result
    await db.insert(diagnosticResult).values({
      userId,
      overallCefr: results.overallCefr,
      confidence: results.confidence,
      skillBreakdown: results.skills,
      answers: processedAnswers.map((a) => ({
        skill: a.skill,
        level: a.level,
        correct: a.correct,
        timeMs: a.timeMs,
      })),
    });

    // Update user_skill_profile for each skill
    const SKILL_MODULE_MAP: Record<string, string> = {
      grammar: "grammar",
      listening: "listening",
      reading: "reading",
      vocabulary: "grammar", // Vocabulary maps to grammar module for adaptive purposes
    };

    for (const [skill, result] of Object.entries(results.skills)) {
      const module = SKILL_MODULE_MAP[skill];
      if (!module || skill === "vocabulary") continue; // Skip vocab (maps to grammar)

      await db
        .insert(userSkillProfile)
        .values({
          userId,
          module,
          currentLevel: result.level,
          accuracyLast10: result.correct / Math.max(result.total, 1),
        })
        .onConflictDoUpdate({
          target: [userSkillProfile.userId, userSkillProfile.module],
          set: {
            currentLevel: result.level,
            accuracyLast10: result.correct / Math.max(result.total, 1),
            updatedAt: new Date(),
          },
        });
    }

    // Award XP: 50 first time, 25 retake
    const [existingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagnosticResult)
      .where(eq(diagnosticResult.userId, userId));

    const xpAmount = (existingCount?.count ?? 0) <= 1 ? 50 : 25;

    await db.insert(activityLog).values({
      userId,
      activityType: "diagnostic_test",
      xpEarned: xpAmount,
      metadata: { overallCefr: results.overallCefr, confidence: results.confidence },
    });

    return Response.json({
      ...results,
      xpAwarded: xpAmount,
    });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
