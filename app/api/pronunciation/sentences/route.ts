import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { getExamContext, parseExamMode } from "@/lib/exam-mode/context";
import type { ExamMode } from "@/components/app/shared/ExamModeProvider";

/**
 * POST /api/pronunciation/sentences
 *
 * Generates practice sentences for pronunciation exercises.
 * Uses the user's exam mode preference to tailor content.
 *
 * Body: { level?: "beginner" | "intermediate" | "advanced", count?: number }
 * Returns: { sentences: { text: string; ipa: string; tip: string }[] }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let level = "intermediate";
  let count = 5;
  let examMode: ExamMode = "toeic";

  try {
    const body = await request.json();
    if (body.level === "beginner" || body.level === "advanced") level = body.level;
    if (typeof body.count === "number" && body.count >= 1 && body.count <= 10) count = body.count;
    examMode = parseExamMode(body.examMode);
  } catch {
    // Use defaults
  }

  // If no examMode in body, fetch from DB
  if (!examMode || examMode === "toeic") {
    const prefRows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);
    if (prefRows[0]?.examMode) examMode = prefRows[0].examMode as ExamMode;
  }

  const ctx = getExamContext(examMode);

  const systemPrompt = `You are an English pronunciation coach for ${ctx.label} preparation.
Generate ${count} English sentences for pronunciation practice.

Level: ${level}
- beginner: short common phrases (5-8 words), everyday topics
- intermediate: medium sentences (8-15 words), ${level === "intermediate" ? ctx.dailyChallengeTopics : "general topics"}
- advanced: complex sentences (12-20 words) with challenging sounds

For each sentence, provide:
1. "text": The sentence to practice
2. "ipa": IPA phonetic transcription of the full sentence
3. "tip": A short pronunciation tip in Vietnamese about the trickiest part

Focus on sounds commonly challenging for Vietnamese speakers:
- /θ/ and /ð/ (th sounds)
- /r/ vs /l/
- /ʃ/ vs /s/ (sh vs s)
- word stress and intonation
- linked sounds between words
- final consonants (/t/, /d/, /s/, /z/)

Return ONLY valid JSON:
{
  "sentences": [
    { "text": "The weather is getting better.", "ipa": "/ðə ˈwɛðər ɪz ˈɡɛtɪŋ ˈbɛtər/", "tip": "Chú ý âm /ð/ trong 'the' và 'weather' - đặt lưỡi giữa hai hàm răng." }
  ]
}`;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${count} ${level} pronunciation practice sentences for ${ctx.label}. Return JSON only.` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    return Response.json(parsed);
  } catch (err) {
    console.error("[pronunciation/sentences] Error:", err);
    return Response.json({ error: "Failed to generate sentences" }, { status: 502 });
  }
}
