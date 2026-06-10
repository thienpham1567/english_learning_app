import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { GrammarCheckRequestSchema, GrammarCheckResponseSchema } from "@/lib/writing-tools/schema";

const log = routeLogger("writing-tools/grammar-check");

const SYSTEM_PROMPT = `You are a professional English grammar checker for Vietnamese learners of English.

INPUT HANDLING (check first):
- If the input is NOT meaningful English to check (e.g. it is Vietnamese, gibberish, random characters, or an unintelligible fragment), do NOT invent errors. Return empty "errors", "correctedText" equal to the original input, zeroed "stats", and set "notice" to a short Vietnamese message explaining that the text is not valid English to check (e.g. "Văn bản này không phải tiếng Anh hợp lệ để kiểm tra.").
- Otherwise, analyze the text and find ALL errors: grammar mistakes, spelling errors, and style issues.

For each error, provide:
- original: the EXACT erroneous substring, copied verbatim from the input (must appear in the input exactly as written, same casing and spacing)
- correction: the corrected text
- offset: the character index where "original" starts in the input
- length: the number of characters "original" spans
- type: "grammar", "spelling", or "style"
- explanationVi: a clear, beginner-friendly explanation of the correction in VIETNAMESE (Tiếng Việt). This is the main explanation shown to the learner — write it naturally, not a literal translation.
- explanationEn: a concise explanation of the same correction in English.
- rule: the grammar rule name in English (e.g. "subject-verb agreement", "article usage", "word order")

Also provide:
- correctedText: the full text with all corrections applied
- stats: count of each error type { grammar, spelling, style } — must match the "errors" array

If the text is valid English but has no errors, return an empty "errors" array with the original text as "correctedText" and no notice.

Return ONLY valid JSON matching this schema:
{
  "errors": [{ "offset": 0, "length": 5, "type": "grammar", "original": "...", "correction": "...", "explanationVi": "...", "explanationEn": "...", "rule": "..." }],
  "correctedText": "...",
  "stats": { "grammar": 0, "spelling": 0, "style": 0 }
}`;

// Rate limiter: 5 req/min per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
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
    return Response.json({ error: "Too many requests. Please wait 1 minute." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = GrammarCheckRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { text } = parsed.data;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const json = JSON.parse(content);
      const validated = GrammarCheckResponseSchema.safeParse(json);

      if (validated.success) {
        return Response.json(validated.data);
      }

      log.warn(
        { attempt: attempt + 1, errors: validated.error.flatten() },
        "grammar-check.validation.failed",
      );
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "grammar-check.failed");
    }
  }

  return Response.json({ error: "Unable to check grammar. Please try again." }, { status: 502 });
}
