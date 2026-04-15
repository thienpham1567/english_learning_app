import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vocabularyCache } from "@/lib/db/schema";
import { normalizeVocabulary } from "@/lib/schemas/vocabulary";

type Params = Promise<{ query: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
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

  const rows = await db
    .select({ data: vocabularyCache.data })
    .from(vocabularyCache)
    .where(and(eq(vocabularyCache.query, q), gt(vocabularyCache.expiresAt, sql`now()`)))
    .limit(1);

  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json(normalizeVocabulary(rows[0].data));
}
