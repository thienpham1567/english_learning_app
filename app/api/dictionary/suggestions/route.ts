import { NextResponse } from "next/server";
import { ilike, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { vocabularyCache } from "@/lib/db/schema";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim().toLowerCase();

  if (q.length < 2 || !allowedQueryPattern.test(q)) {
    return NextResponse.json({ suggestions: [] });
  }

  const rows = await db
    .select({ query: vocabularyCache.query })
    .from(vocabularyCache)
    .where(ilike(vocabularyCache.query, `${q}%`))
    .orderBy(desc(vocabularyCache.expiresAt))
    .limit(6);

  return NextResponse.json({ suggestions: rows.map((r) => r.query) });
}
