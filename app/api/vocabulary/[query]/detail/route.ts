import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vocabularyCache } from "@/lib/db/schema";

type Params = Promise<{ query: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await params;
  const q = decodeURIComponent(query);

  const rows = await db
    .select({ data: vocabularyCache.data })
    .from(vocabularyCache)
    .where(eq(vocabularyCache.query, q))
    .limit(1);

  if (!rows[0]) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json(rows[0].data);
}
