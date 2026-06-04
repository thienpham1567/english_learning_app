import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("writing-practice/review");

import { db, writingSubmission } from "@repo/database";
import { logActivity } from "@/lib/activity-log";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { ReviewRequestSchema, WritingFeedbackSchema } from "@/lib/writing-practice/schema";
import { awardXP, XP_VALUES } from "@/lib/xp";

const REVIEW_SYSTEM_PROMPT = `You are Christine Ho, an ETS-certified TOEIC Writing evaluator with 15+ years of scoring experience.
Review the student's writing using official TOEIC Writing scoring criteria.

═══════════════════════════════════════════════
SCORING RUBRIC (0-5, in 0.5 increments)
═══════════════════════════════════════════════

### grammar (Grammar & Sentence Structure)
- 5: No errors; varied and sophisticated sentence structures
- 4: Minor errors that don't impede comprehension; good variety
- 3: Some errors; limited sentence variety but generally clear
- 2: Frequent errors that occasionally obscure meaning
- 1: Pervasive errors; meaning often unclear
- 0: Incomprehensible or no response

### vocabulary (Vocabulary & Word Choice)
- 5: Precise, natural word choice; wide range; strong collocations
- 4: Generally accurate; good range; minor awkwardness
- 3: Adequate but repetitive; some misuse of words
- 2: Limited range; frequent misuse affecting clarity
- 1: Very basic or inappropriate vocabulary throughout
- 0: No meaningful vocabulary use

### organization (Organization & Coherence)
- 5: Logical flow; effective transitions; clear paragraph structure
- 4: Generally well-organized; some transitions; clear structure
- 3: Basic organization; weak transitions; readable but choppy
- 2: Poor organization; ideas jump around; hard to follow
- 1: No discernible organization
- 0: No response

### taskCompletion (Task Completion & Relevance)
- 5: Fully addresses all task requirements with relevant supporting details
- 4: Addresses most requirements; supporting details present
- 3: Partially addresses requirements; some points missed
- 2: Barely addresses the task; major points missing
- 1: Off-topic or minimally relevant
- 0: No response or completely irrelevant

═══════════════════════════════════════════════
CATEGORY-SPECIFIC EVALUATION
═══════════════════════════════════════════════

For "sentence-picture" (Q1-Q5):
- Check if BOTH required words are used correctly
- Check if the sentence accurately describes the scene
- Grammar is weighted most heavily (simple sentence structure suffices)
- Target: 1-2 sentences, 20-40 words

For "email-response" (Q6-Q7):
- Check if ALL points in the original email are addressed
- Check for appropriate business email tone and format
- Check greeting and closing conventions
- Target: 80+ words

For "opinion-essay" (Q8):
- Check for clear thesis/position statement
- Check for supporting reasons with examples
- Check paragraph structure (intro, body, conclusion)
- Target: 200+ words

═══════════════════════════════════════════════
COMMON TOEIC WRITING ERRORS TO FLAG
═══════════════════════════════════════════════
- Subject-verb agreement (especially with collective nouns)
- Article misuse (a/an/the/zero article)
- Tense consistency (mixing past/present inappropriately)
- Preposition errors (common L1 interference)
- Run-on sentences / comma splices
- Word form errors (noun used as verb, etc.)
- Awkward collocations (e.g., "do a decision" → "make a decision")
- Missing/incorrect plural forms
- Dangling modifiers

═══════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════
Calculate overallScore as the weighted average:
- sentence-picture: grammar 40%, taskCompletion 30%, vocabulary 20%, organization 10%
- email-response: taskCompletion 30%, grammar 25%, organization 25%, vocabulary 20%
- opinion-essay: organization 25%, grammar 25%, vocabulary 25%, taskCompletion 25%

Provide inline annotations for specific errors. Each annotation has:
- startIndex/endIndex: character positions in the original text
- type: "grammar", "vocabulary", or "coherence"
- suggestion: the corrected version
- explanation: why it's wrong and how to fix it (keep concise, 1-2 sentences)

Provide generalFeedback in English: 3-5 sentences with specific praise and actionable improvement tips.
Provide generalFeedbackVi in Vietnamese: translation of the above.
Provide improvedVersion: a rewritten version at score-5 level, maintaining the student's intended message.

Return ONLY valid JSON matching this schema:
{
  "scores": { "grammar": 3.5, "vocabulary": 3.0, "organization": 3.5, "taskCompletion": 4.0 },
  "overallScore": 3.5,
  "annotations": [{ "startIndex": 0, "endIndex": 10, "type": "grammar", "suggestion": "...", "explanation": "..." }],
  "generalFeedback": "...",
  "generalFeedbackVi": "...",
  "improvedVersion": "..."
}`;

// In-memory rate limiter: max 3 requests per user per minute (expensive AI calls)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = ReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { prompt, category, text } = parsed.data;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: REVIEW_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Category: ${category}\nPrompt: ${prompt}\n\nStudent's writing:\n${text}`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const json = JSON.parse(content);
      const validated = WritingFeedbackSchema.safeParse(json);

      if (validated.success) {
        const feedback = validated.data;

        // Persist to DB
        await db.insert(writingSubmission).values({
          userId: session.user.id,
          category,
          prompt,
          text,
          wordCount,
          overallBand: feedback.overallScore,
          scores: feedback.scores,
          feedback,
        });

        // Award XP for writing submission
        void awardXP(session.user.id, XP_VALUES.WRITING_SUBMISSION).catch(() => {});
        logActivity(session.user.id, "writing_practice", XP_VALUES.WRITING_SUBMISSION, {
          wordCount,
          overallScore: feedback.overallScore,
        });

        return Response.json({ feedback });
      }

      log.warn(
        { attempt: attempt + 1, errors: validated.error.flatten() },
        "writing-practice.review.validation.failed",
      );
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "writing-practice.review.failed");
    }
  }

  return Response.json({ error: "Failed to review writing. Please try again." }, { status: 502 });
}
