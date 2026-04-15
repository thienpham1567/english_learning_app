import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userVocabulary } from "@repo/database";

type Params = Promise<{ query: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query: rawQuery } = await params;
  const query = decodeURIComponent(rawQuery);
  const body = (await req.json().catch(() => null)) as { saved?: unknown } | null;

  if (typeof body?.saved !== "boolean") {
    return Response.json({ error: "saved must be a boolean" }, { status: 400 });
  }

  const [updated] = await db
    .update(userVocabulary)
    .set({ saved: body.saved })
    .where(and(eq(userVocabulary.userId, session.user.id), eq(userVocabulary.query, query)))
    .returning({ id: userVocabulary.id, query: userVocabulary.query, saved: userVocabulary.saved });

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(updated);
}
