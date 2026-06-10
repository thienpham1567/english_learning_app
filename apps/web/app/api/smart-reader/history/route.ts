import { db, smartReaderHistory } from "@repo/database";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** GET /api/smart-reader/history — list all history entries */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: smartReaderHistory.id,
      preview: smartReaderHistory.preview,
      difficultyLevel: smartReaderHistory.difficultyLevel,
      createdAt: smartReaderHistory.createdAt,
    })
    .from(smartReaderHistory)
    .where(eq(smartReaderHistory.userId, session.user.id))
    .orderBy(desc(smartReaderHistory.createdAt))
    .limit(50);

  return Response.json(rows);
}
