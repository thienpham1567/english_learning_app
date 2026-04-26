import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingPassage, userVocabulary } from "@repo/database";
import { generateCloze } from "@/lib/reading/cloze";

/**
 * POST /api/reading/cloze
 *
 * Generates cloze test items from a reading passage (AC3).
 *
 * Body: { passageId: string, mode?: "vocab-recall"|"density", density?: number }
 * Returns: { items: ClozeItem[] }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const passageId = body?.passageId;
  const mode = body?.mode === "density" ? "density" : "vocab-recall";
  const density = Math.max(3, Math.min(20, Number(body?.density) || 7));

  if (!passageId || typeof passageId !== "string") {
    return Response.json({ error: "passageId required" }, { status: 400 });
  }

  // Fetch passage
  const [passage] = await db
    .select({ body: readingPassage.body })
    .from(readingPassage)
    .where(eq(readingPassage.id, passageId))
    .limit(1);

  if (!passage) {
    return Response.json({ error: "Passage not found" }, { status: 404 });
  }

  // Fetch user's saved vocabulary lemmas
  const vocabRows = await db
    .select({ query: userVocabulary.query })
    .from(userVocabulary)
    .where(eq(userVocabulary.userId, userId));

  const vocabSet = new Set(vocabRows.map((v) => v.query.toLowerCase()));

  // Generate cloze items (deterministic — AC6)
  const items = generateCloze(passage.body, vocabSet, mode, density);

  return Response.json({ items });
}
