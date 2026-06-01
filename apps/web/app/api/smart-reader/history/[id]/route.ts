import { db, smartReaderHistory } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** GET /api/smart-reader/history/[id] — get full history entry */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select()
    .from(smartReaderHistory)
    .where(
      and(
        eq(smartReaderHistory.id, id),
        eq(smartReaderHistory.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(row);
}

/** DELETE /api/smart-reader/history/[id] — delete a history entry */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db
    .delete(smartReaderHistory)
    .where(
      and(
        eq(smartReaderHistory.id, id),
        eq(smartReaderHistory.userId, session.user.id),
      ),
    );

  return new Response(null, { status: 204 });
}
