import { db, toeicWritingPrompt, toeicWritingResponse, toeicWritingSession } from "@repo/database";
import { recordLearningEvent } from "@repo/modules";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { gradeResponse } from "@/lib/toeic/writing-grader";

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  promptId: z.string().uuid(),
  text: z.string().max(5000),
  durationMs: z.number().int().min(0),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  const { sessionId, promptId, text, durationMs } = parsed.data;
  const userId = session.user.id;

  const [s] = await db
    .select()
    .from(toeicWritingSession)
    .where(and(eq(toeicWritingSession.id, sessionId), eq(toeicWritingSession.userId, userId)))
    .limit(1);
  if (!s) return Response.json({ error: "Session not found" }, { status: 404 });

  const [prompt] = await db
    .select()
    .from(toeicWritingPrompt)
    .where(eq(toeicWritingPrompt.id, promptId))
    .limit(1);
  if (!prompt) return Response.json({ error: "Prompt not found" }, { status: 404 });

  // AI grade
  let grade;
  try {
    grade = await gradeResponse({
      type: prompt.type as "q1_5_picture" | "q6_7_email" | "q8_opinion",
      userText: text,
      maxScore: prompt.maxScore,
      context: {
        mandatoryWords: prompt.mandatoryWords ?? undefined,
        imageUrl: prompt.imageUrl ?? undefined,
        emailSubject: prompt.emailSubject ?? undefined,
        emailBody: prompt.emailBody ?? undefined,
        emailRequirements: prompt.emailRequirements ?? undefined,
        topic: prompt.topic ?? undefined,
      },
    });
  } catch (err) {
    grade = {
      rawScore: 0,
      rubricScores: {},
      feedbackVi: `AI grading failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  await db
    .insert(toeicWritingResponse)
    .values({
      sessionId,
      promptId,
      text,
      durationMs,
      rubricScores: grade.rubricScores,
      rawScore: grade.rawScore,
      feedbackVi: grade.feedbackVi,
    })
    .onConflictDoUpdate({
      target: [toeicWritingResponse.sessionId, toeicWritingResponse.promptId],
      set: {
        text,
        durationMs,
        rubricScores: grade.rubricScores,
        rawScore: grade.rawScore,
        feedbackVi: grade.feedbackVi,
      },
    });

  void recordLearningEvent({
    userId,
    sessionId,
    moduleType: "toeic_writing",
    contentId: promptId,
    skillIds: ["toeic.part5.vocab", "toeic.part5.verb_form", "toeic.part6.grammar"],
    attemptId: sessionId,
    eventType: "exercise_submitted",
    result:
      grade.rawScore >= prompt.maxScore * 0.7
        ? "correct"
        : grade.rawScore > 0
          ? "partial"
          : "incorrect",
    score: grade.rawScore / prompt.maxScore,
    durationMs,
    difficulty: prompt.type === "q8_opinion" ? "advanced" : "intermediate",
    errorTags: [],
  });

  return Response.json({
    rawScore: grade.rawScore,
    maxScore: prompt.maxScore,
    rubricScores: grade.rubricScores,
    feedbackVi: grade.feedbackVi,
  });
}
