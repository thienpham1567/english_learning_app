import { db, toeicDictationItem } from "@repo/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db
    .select()
    .from(toeicDictationItem)
    .where(eq(toeicDictationItem.id, id))
    .limit(1);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  // Don't leak transcript text — only audio + meta until user submits
  return Response.json({
    id: row.id,
    audioUrl: row.audioUrl,
    level: row.level,
    topic: row.topic,
    voice: row.voice,
  });
}
