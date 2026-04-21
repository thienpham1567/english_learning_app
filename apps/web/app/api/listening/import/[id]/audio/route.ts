import { headers } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningImport } from "@repo/database";

const IMPORT_CACHE_DIR = path.join(process.cwd(), ".cache", "listening-imports");

/**
 * GET /api/listening/import/[id]/audio
 *
 * Streams the imported audio file to the authenticated owner only (AC6).
 * Audio is never served publicly — ownership is verified per request.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Ownership check
  const [row] = await db
    .select({ audioKey: listeningImport.audioKey })
    .from(listeningImport)
    .where(and(eq(listeningImport.id, id), eq(listeningImport.userId, userId)))
    .limit(1);

  if (!row) {
    return Response.json({ error: "Import not found" }, { status: 404 });
  }

  const filePath = path.join(IMPORT_CACHE_DIR, `${row.audioKey}.mp3`);

  try {
    const stat = await fs.stat(filePath);
    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(stat.size),
        "Cache-Control": "private, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return Response.json({ error: "Audio file not found on disk" }, { status: 404 });
  }
}
