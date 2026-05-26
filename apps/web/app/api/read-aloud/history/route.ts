import { db, readAloudSession } from "@repo/database";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("read-aloud/history");

/**
 * GET /api/read-aloud/history
 *
 * List user's read-aloud sessions.
 * Query params: mode, limit, offset
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const conditions = [eq(readAloudSession.userId, session.user.id)];
  if (mode) conditions.push(eq(readAloudSession.mode, mode));

  const rows = await db
    .select()
    .from(readAloudSession)
    .where(and(...conditions))
    .orderBy(desc(readAloudSession.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ sessions: rows });
}

/**
 * POST /api/read-aloud/history
 *
 * Save a new practice session.
 * Body: { mode, text?, dialogueId?, voiceRole, speed, wordCount?, durationMs?, shadowScore?, shadowDetails?, preview? }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.mode || !body?.voiceRole) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(readAloudSession)
      .values({
        userId: session.user.id,
        mode: body.mode,
        text: body.text ?? null,
        dialogueId: body.dialogueId ?? null,
        voiceRole: body.voiceRole,
        speed: body.speed ?? 1.0,
        wordCount: body.wordCount ?? 0,
        durationMs: body.durationMs ?? null,
        shadowScore: body.shadowScore ?? null,
        shadowDetails: body.shadowDetails ?? null,
        preview: body.preview ?? (body.text ? body.text.slice(0, 80) : null),
      })
      .returning({ id: readAloudSession.id });

    return Response.json({ id: row.id });
  } catch (err) {
    log.error({ err }, "read-aloud.history.save.failed");
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}

/**
 * DELETE /api/read-aloud/history
 *
 * Delete a session by id.
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(readAloudSession)
    .where(and(eq(readAloudSession.id, body.id), eq(readAloudSession.userId, session.user.id)));

  return Response.json({ ok: true });
}
