import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { conversation, message } from "@repo/database";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [conv] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  if (!conv) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (conv.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, id))
    .orderBy(asc(message.createdAt));

  return Response.json(messages);
}
