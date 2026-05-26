import { db, writingSubmission } from "@repo/database";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: writingSubmission.id,
      category: writingSubmission.category,
      prompt: writingSubmission.prompt,
      text: writingSubmission.text,
      wordCount: writingSubmission.wordCount,
      overallBand: writingSubmission.overallBand,
      scores: writingSubmission.scores,
      feedback: writingSubmission.feedback,
      createdAt: writingSubmission.createdAt,
    })
    .from(writingSubmission)
    .where(eq(writingSubmission.userId, session.user.id))
    .orderBy(desc(writingSubmission.createdAt))
    .limit(10);

  const submissions = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return Response.json({ submissions });
}
