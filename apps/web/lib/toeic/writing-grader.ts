/**
 * TOEIC Writing AI grader.
 *
 * Per question type, follows the official TOEIC scoring rubric:
 * - Q1-5 picture: 0-3 (grammar + appropriate use of mandatory words)
 * - Q6-7 email:   0-4 (quality of response, organization, vocab/grammar)
 * - Q8 opinion:   0-5 (effective response, organization, sentence variety, vocabulary, grammar)
 *
 * Then maps total raw score to 0-200 scaled (linear approximation).
 */
import { z } from "zod";
import { routeLogger } from "@/lib/logger";
import { completeJson } from "@/lib/openai/complete-json";
import { openAiConfig } from "@/lib/openai/config";
import { JSON_ONLY_RULE, PROMPT_TEMPERATURE } from "@/lib/openai/prompt-kit";

const log = routeLogger("toeic/writing-grader");

/** Stable examiner role — cacheable prefix; the rubric + answer go in the user turn. */
const SYSTEM_PROMPT = `You are an ETS-certified TOEIC Writing examiner with 15+ years of scoring experience. Score strictly and consistently against the rubric you are given, erring slightly low when in doubt. ${JSON_ONLY_RULE}`;

const GradeResultSchema = z.object({
  rawScore: z.number(),
  rubricScores: z.record(z.string(), z.number()).default({}),
  feedbackVi: z.string().default(""),
});

export type GradePromptInput = {
  type: "q1_5_picture" | "q6_7_email" | "q8_opinion";
  userText: string;
  maxScore: number;
  context: {
    mandatoryWords?: string[];
    imageUrl?: string;
    emailSubject?: string;
    emailBody?: string;
    emailRequirements?: string[];
    topic?: string;
  };
};

export type GradeResult = {
  rawScore: number; // 0..maxScore
  rubricScores: Record<string, number>;
  feedbackVi: string;
};

function buildUserPrompt(input: GradePromptInput): string {
  const { type, userText, maxScore, context } = input;
  if (type === "q1_5_picture") {
    return `Grade this TOEIC Writing Q1-5 response (write a sentence based on a picture).

Mandatory words (must be used): ${JSON.stringify(context.mandatoryWords ?? [])}
User's sentence:
"""
${userText}
"""

Rubric (0-${maxScore}):
- 3 = grammatically correct sentence using BOTH mandatory words appropriately
- 2 = minor errors but words used correctly
- 1 = either misses a word OR has serious errors
- 0 = blank or unintelligible

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"grammar": <0-3>, "wordUsage": <0-3>},
  "feedbackVi": "<2-3 câu giải thích bằng tiếng Việt>"
}`;
  }
  if (type === "q6_7_email") {
    return `Grade this TOEIC Writing Q6-7 response (respond to an email).

Email subject: ${context.emailSubject ?? ""}
Email body:
"""
${context.emailBody ?? ""}
"""
Requirements (must address each):
${(context.emailRequirements ?? []).map((r, i) => `${i + 1}. ${r}`).join("\n")}

User's reply:
"""
${userText}
"""

Rubric (0-${maxScore}):
- 4 = addresses ALL requirements; well organized; minor errors don't impede understanding
- 3 = addresses most requirements; some grammar/vocab issues
- 2 = misses some requirements OR significant errors
- 1 = barely addresses task or hard to follow
- 0 = blank or off-topic

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"taskCompletion": <0-4>, "organization": <0-4>, "language": <0-4>},
  "feedbackVi": "<3-4 câu góp ý bằng tiếng Việt, ưu tiên điểm yếu nhất>"
}`;
  }
  // q8_opinion
  return `Grade this TOEIC Writing Q8 response (opinion essay).

Topic: ${context.topic ?? ""}

User's essay:
"""
${userText}
"""

Rubric (0-${maxScore}):
- 5 = effective opinion + clear organization + good support + sentence variety + accurate language
- 4 = good response with minor weaknesses
- 3 = reasonable response with noticeable issues in 1-2 areas
- 2 = limited response or significant issues
- 1 = barely on topic
- 0 = blank or off-topic

Word count: ${userText.trim().split(/\s+/).length} words (target ≥300).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"content": <0-5>, "organization": <0-5>, "language": <0-5>, "sentenceVariety": <0-5>},
  "feedbackVi": "<4-5 câu góp ý bằng tiếng Việt, ưu tiên 2 điểm yếu nhất + 1 điểm mạnh>"
}`;
}

export async function gradeResponse(input: GradePromptInput): Promise<GradeResult> {
  const t0 = Date.now();
  const parsed = await completeJson({
    model: openAiConfig.models.grader,
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    schema: GradeResultSchema,
    temperature: PROMPT_TEMPERATURE.grading,
  });
  log.info({ type: input.type, durationMs: Date.now() - t0 }, "toeic.grade_writing");
  const rawScore = Math.min(input.maxScore, Math.max(0, Number(parsed.rawScore) || 0));
  return {
    rawScore,
    rubricScores: parsed.rubricScores,
    feedbackVi: parsed.feedbackVi,
  };
}

/**
 * Sum raw scores across 8 questions. Q1-5 max 3 each (15), Q6-7 max 4 each (8),
 * Q8 max 5. Total max raw = 28. Scaled to 0-200 linearly.
 */
export function rawToScaledWriting(rawSum: number): number {
  const MAX_RAW = 28;
  return Math.round((rawSum / MAX_RAW) * 200);
}
