import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { writingSubmission } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { ReviewRequestSchema, WritingFeedbackSchema } from "@/lib/writing-practice/schema";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { logActivity } from "@/lib/activity-log";

const REVIEW_SYSTEM_PROMPT = `You are Christine Ho, an expert TOEIC Writing evaluator and English tutor.
Review the student's writing based on TOEIC Writing scoring criteria.

Score each criterion from 1.0 to 9.0 in 0.5 increments:
- taskResponse: How well the response addresses the task requirements
- coherenceCohesion: Organization, logical flow, and paragraph structure
- lexicalResource: Vocabulary range, accuracy, and appropriateness for the context
- grammaticalRange: Grammar range, accuracy, and sentence variety

Calculate overallBand as the average of all four scores, rounded to the nearest 0.5.

Provide inline annotations for specific errors. Each annotation has:
- startIndex/endIndex: character positions in the original text
- type: "grammar", "vocabulary", or "coherence"
- suggestion: the corrected version
- explanation: why it's wrong and how to fix it

Provide general feedback in English and Vietnamese translation.
Provide an improved version of the text at a high-scoring level.

Return ONLY valid JSON matching this schema:
{
  "scores": { "taskResponse": 6.0, "coherenceCohesion": 5.5, "lexicalResource": 6.0, "grammaticalRange": 5.5 },
  "overallBand": 5.75,
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
          overallBand: feedback.overallBand,
          scores: feedback.scores,
          feedback,
        });

        // Award XP for writing submission
        void awardXP(session.user.id, XP_VALUES.WRITING_SUBMISSION).catch(() => {});
        logActivity(session.user.id, "writing_practice", XP_VALUES.WRITING_SUBMISSION, { wordCount, overallBand: feedback.overallBand });

        return Response.json({ feedback });
      }

      console.warn(
        `[writing-practice] AI feedback validation failed (attempt ${attempt + 1}):`,
        validated.error.flatten(),
      );
    } catch (err) {
      console.error(`[writing-practice] Review failed (attempt ${attempt + 1}):`, err);
    }
  }

  return Response.json({ error: "Failed to review writing. Please try again." }, { status: 502 });
}
