import { db, toeicAttempt } from "@repo/database";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(toeicAttempt)
    .where(
      and(
        eq(toeicAttempt.userId, session.user.id),
        eq(toeicAttempt.mode, "mock_test"),
        isNotNull(toeicAttempt.completedAt),
      ),
    )
    .orderBy(desc(toeicAttempt.completedAt))
    .limit(20);
  return Response.json({ attempts: rows });
}
