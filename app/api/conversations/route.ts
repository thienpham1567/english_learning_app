import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/db/schema";
import { DEFAULT_PERSONA_ID, PERSONA_IDS } from "@/lib/chat/personas";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      personaId: conversation.personaId,
    })
    .from(conversation)
    .where(eq(conversation.userId, session.user.id))
    .orderBy(desc(conversation.updatedAt));

  return Response.json(rows);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    title?: unknown;
    personaId?: unknown;
  } | null;

  const title =
    typeof body?.title === "string" && body.title.trim().length > 0
      ? body.title.trim()
      : "New conversation";

  const personaId =
    typeof body?.personaId === "string" && PERSONA_IDS.includes(body.personaId)
      ? body.personaId
      : DEFAULT_PERSONA_ID;

  const [created] = await db
    .insert(conversation)
    .values({ userId: session.user.id, title, personaId })
    .returning({
      id: conversation.id,
      title: conversation.title,
      personaId: conversation.personaId,
    });

  return Response.json(created, { status: 201 });
}
