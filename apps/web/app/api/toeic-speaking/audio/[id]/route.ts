import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { db, toeicSpeakingResponse, toeicSpeakingSession } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Authenticated audio streaming for TOEIC Speaking responses.
 * Only the session owner can fetch their own recordings.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const rows = await db
    .select({
      audioPath: toeicSpeakingResponse.audioPath,
      ownerId: toeicSpeakingSession.userId,
    })
    .from(toeicSpeakingResponse)
    .innerJoin(toeicSpeakingSession, eq(toeicSpeakingResponse.sessionId, toeicSpeakingSession.id))
    .where(eq(toeicSpeakingResponse.id, id))
    .limit(1);

  const row = rows[0];
  if (!row || !row.audioPath) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (row.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve absolute path safely (prevent path traversal)
  const resolved = join(process.cwd(), row.audioPath);
  if (!resolved.startsWith(join(process.cwd(), "uploads"))) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const stats = await stat(resolved);
    const stream = createReadStream(resolved);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/webm",
        "Content-Length": String(stats.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "File not on disk" }, { status: 404 });
  }
}
