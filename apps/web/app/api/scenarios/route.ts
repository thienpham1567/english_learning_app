import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { scenarioProgress, activityLog } from "@repo/database";
import { SCENARIOS, getScenarioById } from "@/lib/scenarios/data";

/**
 * GET /api/scenarios
 *
 * Returns all scenarios with user's progress.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all progress for this user
  const progress = await db
    .select()
    .from(scenarioProgress)
    .where(eq(scenarioProgress.userId, userId));

  // Build response
  const scenarios = SCENARIOS.map((scenario) => {
    const scenarioSteps = progress.filter((p) => p.scenarioId === scenario.id);
    const completedSteps = scenarioSteps
      .filter((p) => p.completedAt !== null)
      .map((p) => p.stepIndex);

    return {
      id: scenario.id,
      title: scenario.title,
      emoji: scenario.emoji,
      description: scenario.description,
      level: scenario.level,
      estimatedMinutes: scenario.estimatedMinutes,
      totalSteps: scenario.steps.length,
      completedSteps: completedSteps.length,
      isComplete: completedSteps.length === scenario.steps.length,
      steps: scenario.steps.map((step, i) => ({
        title: step.title,
        type: step.type,
        icon: step.icon,
        completed: completedSteps.includes(i),
        xp: step.xp,
      })),
    };
  });

  return Response.json({ scenarios });
}

/**
 * POST /api/scenarios
 *
 * Body: { scenarioId, stepIndex, score? }
 * Marks a step as completed and awards XP.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { scenarioId, stepIndex, score } = body;

  if (!scenarioId || stepIndex === undefined) {
    return Response.json({ error: "Missing scenarioId or stepIndex" }, { status: 400 });
  }

  const scenario = getScenarioById(scenarioId);
  if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) {
    return Response.json({ error: "Invalid scenario or step" }, { status: 400 });
  }

  const step = scenario.steps[stepIndex];

  // Check if already completed
  const existing = await db
    .select()
    .from(scenarioProgress)
    .where(
      and(
        eq(scenarioProgress.userId, userId),
        eq(scenarioProgress.scenarioId, scenarioId),
        eq(scenarioProgress.stepIndex, stepIndex),
      ),
    )
    .limit(1);

  if (existing[0]?.completedAt) {
    return Response.json({ alreadyCompleted: true, xpAwarded: 0 });
  }

  // Upsert progress
  if (existing[0]) {
    await db
      .update(scenarioProgress)
      .set({ score: score ?? null, completedAt: new Date() })
      .where(eq(scenarioProgress.id, existing[0].id));
  } else {
    await db.insert(scenarioProgress).values({
      userId,
      scenarioId,
      stepIndex,
      score: score ?? null,
      completedAt: new Date(),
    });
  }

  // Award XP
  await db.insert(activityLog).values({
    userId,
    activityType: "writing_practice", // closest existing type for scenario activities
    xpEarned: step.xp,
    metadata: { scenario: scenarioId, step: stepIndex, stepTitle: step.title },
  });

  // Check if all steps now complete → bonus XP
  const allProgress = await db
    .select({ stepIndex: scenarioProgress.stepIndex })
    .from(scenarioProgress)
    .where(
      and(
        eq(scenarioProgress.userId, userId),
        eq(scenarioProgress.scenarioId, scenarioId),
        sql`${scenarioProgress.completedAt} IS NOT NULL`,
      ),
    );

  const completedSet = new Set(allProgress.map((p) => p.stepIndex));
  const allComplete = scenario.steps.every((_, i) => completedSet.has(i));
  let bonusXp = 0;

  if (allComplete) {
    bonusXp = scenario.bonusXp;
    await db.insert(activityLog).values({
      userId,
      activityType: "writing_practice",
      xpEarned: bonusXp,
      metadata: { scenario: scenarioId, event: "scenario_complete" },
    });
  }

  return Response.json({
    xpAwarded: step.xp,
    bonusXp,
    allComplete,
    stepCompleted: stepIndex,
  });
}
