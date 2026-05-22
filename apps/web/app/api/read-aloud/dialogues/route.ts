import { headers } from "next/headers";
import { eq, desc, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readAloudDialogue } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("read-aloud/dialogues");

/**
 * GET /api/read-aloud/dialogues
 *
 * List user's saved dialogues.
 * Query params: limit, offset
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const rows = await db
    .select()
    .from(readAloudDialogue)
    .where(eq(readAloudDialogue.userId, session.user.id))
    .orderBy(desc(readAloudDialogue.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ dialogues: rows });
}

/**
 * POST /api/read-aloud/dialogues
 *
 * Save a newly generated dialogue.
 * Body: { title, context, topic, speakerCount, lines, voiceConfig }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.lines || !body?.voiceConfig) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(readAloudDialogue)
      .values({
        userId: session.user.id,
        title: body.title,
        context: body.context ?? null,
        topic: body.topic ?? null,
        speakerCount: body.speakerCount ?? 2,
        linesJson: body.lines,
        voiceConfigJson: body.voiceConfig,
      })
      .returning({ id: readAloudDialogue.id });

    return Response.json({ id: row.id });
  } catch (err) {
    log.error({ err }, "read-aloud.dialogues.save.failed");
    return Response.json({ error: "Failed to save dialogue" }, { status: 500 });
  }
}

/**
 * PATCH /api/read-aloud/dialogues
 *
 * Update dialogue metadata.
 * Body: { id, bookmarked?, incrementRolePlay? }
 */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return Response.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};

  if (typeof body.bookmarked === "boolean") {
    updates.bookmarked = body.bookmarked;
  }

  if (body.incrementRolePlay) {
    // Fetch current count and increment
    const [current] = await db
      .select({ rolePlayCount: readAloudDialogue.rolePlayCount })
      .from(readAloudDialogue)
      .where(and(eq(readAloudDialogue.id, body.id), eq(readAloudDialogue.userId, session.user.id)))
      .limit(1);

    if (current) {
      updates.rolePlayCount = (current.rolePlayCount ?? 0) + 1;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided" }, { status: 400 });
  }

  await db
    .update(readAloudDialogue)
    .set(updates)
    .where(and(eq(readAloudDialogue.id, body.id), eq(readAloudDialogue.userId, session.user.id)));

  return Response.json({ ok: true });
}

/**
 * DELETE /api/read-aloud/dialogues
 *
 * Delete a saved dialogue.
 * Body: { id }
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(readAloudDialogue)
    .where(and(eq(readAloudDialogue.id, body.id), eq(readAloudDialogue.userId, session.user.id)));

  return Response.json({ ok: true });
}
