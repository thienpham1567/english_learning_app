import { db, userVocabulary } from "@repo/database";
import { eq, and, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * POST /api/vocabulary/check-saved
 * Body: { words: string[] }
 * Returns: { saved: string[] } — list of words the user has saved
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.words || !Array.isArray(body.words)) {
    return Response.json({ error: "Missing words array" }, { status: 400 });
  }

  const words: string[] = body.words
    .filter((w: unknown) => typeof w === "string")
    .map((w: string) => w.toLowerCase().trim())
    .slice(0, 50); // limit

  if (words.length === 0) {
    return Response.json({ saved: [] });
  }

  const rows = await db
    .select({ query: userVocabulary.query })
    .from(userVocabulary)
    .where(
      and(
        eq(userVocabulary.userId, session.user.id),
        eq(userVocabulary.saved, true),
        inArray(userVocabulary.query, words),
      ),
    );

  return Response.json({ saved: rows.map((r) => r.query) });
}
