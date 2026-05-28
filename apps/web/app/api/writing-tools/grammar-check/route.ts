import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { GrammarCheckRequestSchema, GrammarCheckResponseSchema } from "@/lib/writing-tools/schema";

const log = routeLogger("writing-tools/grammar-check");

const SYSTEM_PROMPT = `You are a professional English grammar checker.

Analyze the given text and find ALL errors: grammar mistakes, spelling errors, and style issues.

For each error, provide:
- offset: the character index where the error starts in the original text
- length: the number of characters the error spans
- type: "grammar", "spelling", or "style"
- original: the exact erroneous text
- correction: the corrected text
- explanationVi: brief summary or note about the correction (in English)
- explanationEn: detailed explanation in English
- rule: the grammar rule name (e.g. "subject-verb agreement", "article usage", "word order")

Also provide:
- correctedText: the full text with all corrections applied
- stats: count of each error type { grammar, spelling, style }

If the text has no errors, return empty errors array with the original text as correctedText.

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
