import { db, listeningImport } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * GET /api/listening/import/[id]
 *
 * Returns the full import data for the authenticated owner.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const [row] = await db
    .select()
    .from(listeningImport)
    .where(and(eq(listeningImport.id, id), eq(listeningImport.userId, userId)))
    .limit(1);

  if (!row) {
    return Response.json({ error: "Import not found" }, { status: 404 });
  }

  return Response.json({
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    durationSec: row.durationSec,
    transcript: row.transcriptJson,
    keyVocab: row.keyVocabJson,
    quiz: row.quizJson,
    audioUrl: `/api/listening/import/${row.id}/audio`,
    createdAt: row.createdAt,
  });
}
