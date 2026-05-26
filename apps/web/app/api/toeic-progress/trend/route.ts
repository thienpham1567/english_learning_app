import { db, learningEvent } from "@repo/database";
import { and, eq, gte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      day: sql<string>`DATE(${learningEvent.createdAt})`,
      module: learningEvent.moduleType,
      c: sql<number>`count(*)::int`,
    })
    .from(learningEvent)
    .where(
      and(
        eq(learningEvent.userId, userId),
        gte(learningEvent.createdAt, since),
        sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
      ),
    )
    .groupBy(sql`DATE(${learningEvent.createdAt})`, learningEvent.moduleType)
    .orderBy(sql`DATE(${learningEvent.createdAt})`);

  return Response.json({ trend: rows });
}
