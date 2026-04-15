import { headers } from "next/headers";
import { eq, desc, and, sql, ilike, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { errorLog } from "@repo/database";

/**
 * GET /api/errors
 *
 * List user's error log with optional filters.
 * Query params: module, topic, resolved, limit, offset
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sourceModule = url.searchParams.get("module");
  const topic = url.searchParams.get("topic");
  const resolved = url.searchParams.get("resolved");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const conditions = [eq(errorLog.userId, session.user.id)];
  if (sourceModule) conditions.push(eq(errorLog.sourceModule, sourceModule));
  if (topic) conditions.push(ilike(errorLog.grammarTopic, `%${topic}%`));
  if (resolved === "true") conditions.push(eq(errorLog.isResolved, true));
  if (resolved === "false") conditions.push(eq(errorLog.isResolved, false));

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(errorLog)
      .where(and(...conditions))
      .orderBy(desc(errorLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(errorLog)
      .where(and(...conditions)),
  ]);

  // Get unique topics for filter UI
  const topics = await db
    .selectDistinct({ topic: errorLog.grammarTopic })
    .from(errorLog)
    .where(eq(errorLog.userId, session.user.id));

  return Response.json({
    errors: rows,
    total: countResult[0]?.count ?? 0,
    topics: topics.map((t) => t.topic).filter(Boolean),
  });
}

/**
 * POST /api/errors
 *
 * Log one or more wrong answers (batch insert).
 * Body: { errors: Array<{ sourceModule, questionStem, options?, userAnswer, correctAnswer, explanationEn?, explanationVi?, grammarTopic? }> }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { errors: errorItems } = body;

    if (!Array.isArray(errorItems) || errorItems.length === 0) {
      return Response.json({ error: "No errors to log" }, { status: 400 });
    }

    if (errorItems.length > 50) {
      return Response.json({ error: "Max 50 errors per request" }, { status: 400 });
    }

    const rows = errorItems.map((e: Record<string, unknown>) => ({
      userId: session.user.id,
      sourceModule: String(e.sourceModule ?? "unknown"),
      questionStem: String(e.questionStem ?? ""),
      options: (e.options as string[]) ?? null,
      userAnswer: String(e.userAnswer ?? ""),
      correctAnswer: String(e.correctAnswer ?? ""),
      explanationEn: e.explanationEn ? String(e.explanationEn) : null,
      explanationVi: e.explanationVi ? String(e.explanationVi) : null,
      grammarTopic: e.grammarTopic ? String(e.grammarTopic) : null,
    }));

    await db.insert(errorLog).values(rows);

    return Response.json({ logged: rows.length });
  } catch (err) {
    console.error("[errors] POST Error:", err);
    return Response.json({ error: "Failed to log errors" }, { status: 500 });
  }
}

/**
 * PATCH /api/errors
 *
 * Mark error(s) as resolved.
 * Body: { ids: string[] }
 */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "No IDs provided" }, { status: 400 });
    }

    await db
      .update(errorLog)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(and(inArray(errorLog.id, ids), eq(errorLog.userId, session.user.id)));

    return Response.json({ resolved: ids.length });
  } catch (err) {
    console.error("[errors] PATCH Error:", err);
    return Response.json({ error: "Failed to resolve" }, { status: 500 });
  }
}
