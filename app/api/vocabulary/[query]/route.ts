import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary } from "@/lib/db/schema";

type Params = Promise<{ query: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await params;
  let q: string;
  try {
    q = decodeURIComponent(query);
  } catch {
    return Response.json({ error: "invalid_query" }, { status: 400 });
  }

  await db
    .delete(userVocabulary)
    .where(and(eq(userVocabulary.userId, session.user.id), eq(userVocabulary.query, q)));

  return Response.json({ ok: true });
}
