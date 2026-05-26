import { db, toeicQuestion, toeicVocab } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [word] = await db.select().from(toeicVocab).where(eq(toeicVocab.id, id)).limit(1);
  if (!word) return Response.json({ error: "Word not found" }, { status: 404 });

  // Find up to 10 TOEIC questions where the word appears in question_text or options
  const pattern = `%${word.word}%`;
  const usages = await db
    .select({
      id: toeicQuestion.id,
      number: toeicQuestion.number,
      part: toeicQuestion.part,
      questionText: toeicQuestion.questionText,
      options: toeicQuestion.options,
      explanationVi: toeicQuestion.explanationVi,
      correctIndex: toeicQuestion.correctIndex,
    })
    .from(toeicQuestion)
    .where(
      sql`(${toeicQuestion.questionText} ILIKE ${pattern} OR ${toeicQuestion.options}::text ILIKE ${pattern})`,
    )
    .limit(10);

  return Response.json({ word, usages });
}
