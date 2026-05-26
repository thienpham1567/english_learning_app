import { conversation, db } from "@repo/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(conversation).where(eq(conversation.id, id));

  return new Response(null, { status: 204 });
}
