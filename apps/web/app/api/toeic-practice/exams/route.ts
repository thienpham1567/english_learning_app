import { db, toeicExam } from "@repo/database";
import { asc } from "drizzle-orm";

export async function GET() {
  const exams = await db.select().from(toeicExam).orderBy(asc(toeicExam.year), asc(toeicExam.code));
  return Response.json({ exams });
}
