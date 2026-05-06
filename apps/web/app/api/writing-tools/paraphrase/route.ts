import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import {
  ParaphraseRequestSchema,
  ParaphraseResponseSchema,
  type ParaphraseMode,
} from "@/lib/writing-tools/schema";

const log = routeLogger("writing-tools/paraphrase");

/* ── Mode descriptions for the AI prompt ─────────────── */

const MODE_INSTRUCTIONS: Record<ParaphraseMode, string> = {
  standard:
    "Rewrite the text using different vocabulary and sentence structures while preserving the original meaning.",
  fluency:
    "Improve the text's natural flow and readability. Make it sound more native and smooth.",
  formal:
    "Rephrase the text in a more sophisticated, professional, and polished manner suitable for business or official communication.",
  simple:
    "Simplify the text using easier vocabulary and shorter sentences. Make it accessible to lower-level English learners.",
  creative:
    "Rephrase the text in an original, vivid, and engaging way. Use expressive vocabulary and varied sentence patterns.",
  expand:
    "Expand the text by adding relevant details, examples, and elaboration while maintaining the core meaning.",
  shorten:
    "Condense the text to be more concise. Remove unnecessary words and phrases while keeping the essential meaning.",
};

function getSynonymInstruction(level: number): string {
  if (level <= 30) {
    return "Keep the original wording as close as possible. Only make minimal changes to fix awkward phrasing. Preserve most of the original vocabulary.";
  }
  if (level <= 70) {
    return "Moderately rephrase using different vocabulary while preserving meaning. Replace some common words with better alternatives.";
  }
  return "Aggressively rewrite with advanced vocabulary and restructured sentences. Use sophisticated synonyms and varied sentence patterns. Challenge the reader with richer vocabulary.";
}

function buildSystemPrompt(mode: ParaphraseMode, synonymLevel: number): string {
  return `You are an expert English paraphrasing assistant for Vietnamese learners.

## Task
${MODE_INSTRUCTIONS[mode]}

## Synonym Intensity
${getSynonymInstruction(synonymLevel)}

## Output Format
For each word or phrase you changed, provide:
- original: the original word/phrase
- replacement: the new word/phrase
- reason: brief reason for the change (in Vietnamese)
- definitionVi: Vietnamese definition of the new word (only for vocabulary changes, not structural ones)

Return ONLY valid JSON:
{
  "result": "the paraphrased text",
  "changes": [
    { "original": "...", "replacement": "...", "reason": "...", "definitionVi": "..." }
  ]
}

Keep changes list focused — only list meaningful vocabulary or structural changes, not minor punctuation adjustments.`;
}

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
    return Response.json(
      { error: "Quá nhiều yêu cầu. Vui lòng đợi 1 phút." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = ParaphraseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { text, mode, synonymLevel } = parsed.data;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: mode === "creative" ? 0.8 : 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(mode, synonymLevel) },
          { role: "user", content: text },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const json = JSON.parse(content);
      const validated = ParaphraseResponseSchema.safeParse(json);

      if (validated.success) {
        return Response.json(validated.data);
      }

      log.warn(
        { attempt: attempt + 1, errors: validated.error.flatten() },
        "paraphrase.validation.failed",
      );
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "paraphrase.failed");
    }
  }

  return Response.json(
    { error: "Không thể viết lại văn bản. Vui lòng thử lại." },
    { status: 502 },
  );
}
