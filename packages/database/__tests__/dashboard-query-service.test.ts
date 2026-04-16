import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { DashboardResponseSchema } from "@repo/contracts";

/**
 * Integration tests for DashboardQueryService.
 *
 * Uses the real Supabase database (DATABASE_URL from .env.local).
 * Seeds only the tables used by dashboard aggregation with a unique
 * sentinel userId, then cleans up afterwards.
 *
 * Skipped automatically when DATABASE_URL is not set (e.g. CI without DB).
 * NOTE: When skipped, integration coverage is absent — run locally with DATABASE_URL set.
 */

const hasDb = !!process.env.DATABASE_URL;

if (!hasDb) {
  console.warn(
    "[dashboard-query-service.test] DATABASE_URL not set — integration tests SKIPPED. " +
      "Run with DATABASE_URL=<url> to execute.",
  );
}

const describeWithDb = hasDb ? describe : describe.skip;

// Unique per-run IDs to avoid concurrent test run conflicts
const RUN_SUFFIX = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const TEST_USER_ID = `__test-dqs-${RUN_SUFFIX}__`;
const TEST_QUERY = `__test-dqs-vocab-${RUN_SUFFIX}__`;

// Lazy-loaded modules — avoids "Missing DATABASE_URL" crash when suite is skipped
let db: any;
let schema: any;
let queryService: any;
// todayVN set inside beforeAll to avoid midnight edge case (parse-time evaluation)
let todayVN: string;

describeWithDb("drizzleDashboardQueryService", () => {
  beforeAll(async () => {
    // Set todayVN here (not at module parse time) to avoid midnight rollover edge case
    todayVN = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Dynamic import so the module graph is not evaluated when DATABASE_URL is absent
    const clientMod = await import("../src/client");
    const schemaMod = await import("../src/schema");
    const qsMod = await import("../src/queries/drizzle-dashboard-query-service");
    db = clientMod.db;
    schema = schemaMod;
    queryService = qsMod.drizzleDashboardQueryService;

    // Seed vocabulary_cache first (referenced by user_vocabulary FK)
    await db
      .insert(schema.vocabularyCache)
      .values({
        query: TEST_QUERY,
        data: { headword: "hello", level: "A1" },
        expiresAt: new Date(Date.now() + 86400000),
      })
      .onConflictDoNothing();

    // Seed user_vocabulary — onConflictDoNothing guards against crash-leftover rows
    await db
      .insert(schema.userVocabulary)
      .values({
        userId: TEST_USER_ID,
        query: TEST_QUERY,
        saved: true,
        lookedUpAt: new Date(),
        nextReview: new Date(Date.now() - 3600000), // due 1 hour ago
      })
      .onConflictDoNothing();

    // Seed user_streak
    await db
      .insert(schema.userStreak)
      .values({
        userId: TEST_USER_ID,
        currentStreak: 5,
        bestStreak: 10,
        lastCompletedDate: todayVN,
        xpTotal: 200,
      })
      .onConflictDoNothing();

    // Seed daily_challenge (completed today)
    await db
      .insert(schema.dailyChallenge)
      .values({
        userId: TEST_USER_ID,
        challengeDate: todayVN,
        exercises: [],
        answers: [],
        score: 80,
        completedAt: new Date(),
      })
      .onConflictDoNothing();

    // Seed writing_submission (today)
    await db
      .insert(schema.writingSubmission)
      .values({
        userId: TEST_USER_ID,
        category: "essay",
        prompt: "Test prompt",
        text: "Test text for integration test",
        wordCount: 5,
        overallBand: 6.0,
        scores: {},
        feedback: {},
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    if (!db) return;
    // Clean up in reverse FK order
    await db.delete(schema.writingSubmission).where(eq(schema.writingSubmission.userId, TEST_USER_ID));
    await db.delete(schema.dailyChallenge).where(eq(schema.dailyChallenge.userId, TEST_USER_ID));
    await db.delete(schema.userStreak).where(eq(schema.userStreak.userId, TEST_USER_ID));
    await db.delete(schema.flashcardProgress).where(eq(schema.flashcardProgress.userId, TEST_USER_ID));
    await db.delete(schema.userVocabulary).where(eq(schema.userVocabulary.userId, TEST_USER_ID));
    await db.delete(schema.vocabularyCache).where(eq(schema.vocabularyCache.query, TEST_QUERY));
  });

  it("returns a response matching DashboardResponseSchema", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);
    const parsed = DashboardResponseSchema.safeParse(result);

    if (!parsed.success) {
      console.error("Validation errors:", JSON.stringify(parsed.error.issues, null, 2));
    }
    expect(parsed.success).toBe(true);
  });

  it("returns correct flashcard and vocab due counts", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    // We seeded 1 saved vocab with nextReview in the past and no flashcard_progress
    expect(result.flashcardsDue).toBeGreaterThanOrEqual(1);
    expect(result.vocabDue).toBeGreaterThanOrEqual(1);
  });

  it("returns streak data matching seeded values", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    expect(result.streak.currentStreak).toBe(5);
    expect(result.streak.bestStreak).toBe(10);
    expect(result.streak.lastCompletedDate).toBe(todayVN);
    expect(result.totalXP).toBe(200);
  });

  it("returns completed daily challenge", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    expect(result.dailyChallenge.completed).toBe(true);
    expect(result.dailyChallenge.score).toBe(80);
  });

  it("returns badges with correct unlock status", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    // bestStreak = 10, so streak-3 and streak-7 should be unlocked
    expect(result.badges).toHaveLength(4);
    const streak3 = result.badges.find((b: any) => b.id === "streak-3");
    const streak7 = result.badges.find((b: any) => b.id === "streak-7");
    const streak30 = result.badges.find((b: any) => b.id === "streak-30");

    expect(streak3?.unlocked).toBe(true);
    expect(streak7?.unlocked).toBe(true);
    expect(streak30?.unlocked).toBe(false);
  });

  it("returns recent vocabulary with headword and level", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    expect(result.recentVocabulary.length).toBeGreaterThanOrEqual(1);
    const vocab = result.recentVocabulary.find((v: any) => v.query === TEST_QUERY);
    expect(vocab).toBeDefined();
    expect(vocab!.headword).toBe("hello");
    expect(vocab!.level).toBe("A1");
  });

  it("returns 7 days of weekly activity", async () => {
    const result = await queryService.getOverviewForUser(TEST_USER_ID);

    expect(result.weeklyActivity).toHaveLength(7);
    for (const entry of result.weeklyActivity) {
      expect(typeof entry.day).toBe("string");
      expect(typeof entry.count).toBe("number");
    }
    // Today should have activity (seeded challenge + writing)
    const todayActivity = result.weeklyActivity.find((w: any) => w.day === todayVN);
    expect(todayActivity).toBeDefined();
    expect(todayActivity!.count).toBeGreaterThanOrEqual(2);
  });

  describe("default/fallback behavior", () => {
    const EMPTY_USER_ID = `__test-dqs-empty-${RUN_SUFFIX}__`;

    it("returns default values for a user with no data", async () => {
      const result = await queryService.getOverviewForUser(EMPTY_USER_ID);
      const parsed = DashboardResponseSchema.safeParse(result);

      expect(parsed.success).toBe(true);
      expect(result.flashcardsDue).toBe(0);
      expect(result.vocabDue).toBe(0);
      expect(result.dailyChallenge).toEqual({ completed: false, score: null });
      expect(result.streak).toEqual({
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedDate: null,
      });
      expect(result.totalXP).toBe(0);
      expect(result.recentVocabulary).toEqual([]);
      expect(result.badges).toHaveLength(4);
      expect(result.badges.every((b: any) => !b.unlocked)).toBe(true);
      expect(result.weeklyActivity).toHaveLength(7);
    });
  });
});
