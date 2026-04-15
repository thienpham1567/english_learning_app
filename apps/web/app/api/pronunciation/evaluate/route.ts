import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/pronunciation/evaluate
 *
 * Compares user's spoken text (transcribed by Whisper) with the target sentence.
 * Returns detailed pronunciation feedback.
 *
 * Body: { targetText: string; spokenText: string }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetText, spokenText } = body;

    if (!targetText || !spokenText) {
      return Response.json({ error: "targetText and spokenText are required" }, { status: 400 });
    }

    if (typeof targetText !== "string" || typeof spokenText !== "string") {
      return Response.json({ error: "Invalid input types" }, { status: 400 });
    }

    if (targetText.length > 500 || spokenText.length > 500) {
      return Response.json({ error: "Text too long (max 500 chars)" }, { status: 400 });
    }

    const systemPrompt = `You are an English pronunciation evaluator for Vietnamese learners.
Compare the target sentence with what the learner actually said (transcribed by speech-to-text).

Evaluate:
1. "score": Overall pronunciation score 0-100
2. "accuracy": Word-level accuracy percentage 0-100
3. "fluency": Fluency score 0-100 (natural flow, pauses, rhythm)
4. "feedback": Detailed feedback in Vietnamese (2-3 sentences)
5. "wordAnalysis": Array analyzing each word:
   - "word": the target word
   - "spoken": what was actually said (or "" if missed)
   - "correct": boolean
   - "issue": if incorrect, brief note on the issue (in Vietnamese)
6. "tips": Array of 1-3 specific improvement tips in Vietnamese

Be encouraging but honest. Common Vietnamese speaker issues: final consonants, /θ/ /ð/, /r/ /l/, stress patterns.

Return ONLY valid JSON:
{
  "score": 75,
  "accuracy": 80,
  "fluency": 70,
  "feedback": "Bạn phát âm khá tốt...",
  "wordAnalysis": [{ "word": "the", "spoken": "da", "correct": false, "issue": "Âm /ð/ phát thành /d/" }],
  "tips": ["Luyện âm /θ/ bằng cách đặt lưỡi giữa hai hàm răng"]
}`;

    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Target: "${targetText}"\nSpoken: "${spokenText}"\n\nEvaluate pronunciation accuracy. Return JSON only.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI returned no content" }, { status: 502 });
    }

    const result = JSON.parse(content);
    return Response.json(result);
  } catch (err) {
    console.error("[pronunciation/evaluate] Error:", err);
    return Response.json({ error: "Evaluation failed" }, { status: 502 });
  }
}
