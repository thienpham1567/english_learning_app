import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingPassage, readingProgress, userVocabulary } from "@repo/database";

// CEFR level numeric ordering for "tooHard" calculation
const CEFR_ORDER: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

/**
 * GET /api/reading/passages?level=B1&sort=priority
 *
 * Returns CEFR-graded passages sorted by vocab priority (AC2).
 * Priority score = novelLemmaCount + 0.5 * knownLemmaCount - 2 * tooHardLemmaCount
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = req.nextUrl;
  const levelFilter = searchParams.get("level")?.toUpperCase() || "";
  const sortMode = searchParams.get("sort") || "priority"; // priority | newest

  try {
    // 1. Load all passages (optionally filtered by level)
    let passageQuery = db.select().from(readingPassage).$dynamic();
    if (levelFilter && CEFR_ORDER[levelFilter]) {
      passageQuery = passageQuery.where(eq(readingPassage.cefrLevel, levelFilter));
    }
    const passages = await passageQuery;

    // 2. Load user's read passages
    const readRows = await db
      .select({ passageId: readingProgress.passageId })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));
    const readSet = new Set(readRows.map((r) => r.passageId));

    // 3. Load user's known vocabulary lemmas
    const vocabRows = await db
      .select({ query: userVocabulary.query })
      .from(userVocabulary)
      .where(eq(userVocabulary.userId, userId));
    const knownLemmas = new Set(vocabRows.map((v) => v.query.toLowerCase()));

    // 4. Compute priority scores
    const selectedLevel = CEFR_ORDER[levelFilter] || 3; // default B1

    const scored = passages.map((p) => {
      const lemmas = (p.lexicalTagsJson as string[]) ?? [];
      const passageLevel = CEFR_ORDER[p.cefrLevel] || 3;

      let novelCount = 0;
      let knownCount = 0;
      let tooHardCount = 0;

      for (const lemma of lemmas) {
        const lower = lemma.toLowerCase();
        if (knownLemmas.has(lower)) {
          knownCount++;
        } else {
          // "tooHard" = lemma from a passage > 2 CEFR steps above selected level
          if (passageLevel > selectedLevel + 2) {
            tooHardCount++;
          } else {
            novelCount++;
          }
        }
      }

      const score = novelCount + 0.5 * knownCount - 2 * tooHardCount;

      return {
        id: p.id,
        title: p.title,
        cefrLevel: p.cefrLevel,
        section: p.section,
        wordCount: p.wordCount,
        newWordsCount: novelCount,
        isRead: readSet.has(p.id),
        score,
        createdAt: p.createdAt,
      };
    });

    // 5. Sort
    if (sortMode === "newest") {
      scored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Priority: unread first, then by score descending
      scored.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return b.score - a.score;
      });
    }

    return Response.json({ passages: scored });
  } catch (err) {
    console.error("[Reading] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
