import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/writing/rewrite
 *
 * Returns up to 3 rewritten variants of a sentence at different levels.
 * Rate-limited 20/min/user (AC5). Sentence cap: 400 chars (AC6).
 * No persistence — ephemeral assistive tool (dev notes).
 */

export type RewriteLevel = "natural" | "formal" | "c1";

export type RewriteChange = {
  original: string;
  replacement: string;
  reason: string;
};

export type RewriteVariant = {
  level: RewriteLevel;
  rewrite: string;
  changes: RewriteChange[];
};

export type RewriteResponse = {
  variants: RewriteVariant[];
};

const VALID_LEVELS = new Set<RewriteLevel>(["natural", "formal", "c1"]);

// Rate limiter: 20/min/user (AC5)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_SENTENCE_LENGTH = 400;
const MAX_CONTEXT_LENGTH = 500;

const LEVEL_DESCRIPTIONS: Record<RewriteLevel, string> = {
  natural: "natural, conversational English — fluent but not stiff. Fix awkward phrasing, maintain the register of everyday communication.",
  formal: "formal, professional English — suitable for business emails or reports. Elevate vocabulary and structure; keep it clear and direct.",
  c1: "academic/C1-level English — precise, sophisticated, varied sentence structures. Use advanced collocations and academic vocabulary where appropriate.",
};

function buildPrompt(sentence: string, levels: RewriteLevel[], context?: string): string {
  const levelInstructions = levels
    .map((l) => `- "${l}": ${LEVEL_DESCRIPTIONS[l]}`)
    .join("\n");

  return `You are an expert English writing coach. The learner wants to see how a sentence can be improved at different sophistication levels.

RULES:
- Preserve the EXACT meaning — do NOT change what is being said, only HOW it is said.
- For each level, identify the specific words/phrases you changed and explain why.
- Only include a variant if there is a meaningful improvement. If the original is already optimal for a level, skip it (omit from the response).
- Each "changes" array must list every word-level substitution made.
- Return ONLY valid JSON — no markdown fences.

${context ? `Context: ${context}\n\n` : ""}Sentence to rewrite: "${sentence}"

Levels to produce:
${levelInstructions}

JSON Schema:
{
  "variants": [
    {
      "level": "natural" | "formal" | "c1",
      "rewrite": "the rewritten sentence",
      "changes": [
        {
          "original": "original word or phrase",
          "replacement": "replacement word or phrase",
          "reason": "brief explanation of the improvement"
        }
      ]
    }
  ]
}`;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = Date.now();

  // Evict expired entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Parse body
  const body = (await request.json().catch(() => null)) as {
    sentence?: string;
    targetLevel?: unknown;
    context?: string;
  } | null;

  const sentence = body?.sentence?.trim();
  const context = body?.context?.trim();

  if (!sentence) {
    return Response.json({ error: "No sentence provided" }, { status: 400 });
  }

  // AC6: sentence cap 400 chars
  if (sentence.length > MAX_SENTENCE_LENGTH) {
    return Response.json({
      error: `Sentence too long (max ${MAX_SENTENCE_LENGTH} characters, got ${sentence.length})`,
    }, { status: 400 });
  }

  // Context length cap
  if (context && context.length > MAX_CONTEXT_LENGTH) {
    return Response.json({
      error: `Context too long (max ${MAX_CONTEXT_LENGTH} characters)`,
    }, { status: 400 });
  }

  // Determine levels
  let levels: RewriteLevel[];
  const rawLevel = body?.targetLevel;
  if (rawLevel === undefined || rawLevel === null) {
    levels = ["natural", "formal", "c1"]; // All three (default)
  } else if (typeof rawLevel === "string" && VALID_LEVELS.has(rawLevel as RewriteLevel)) {
    levels = [rawLevel as RewriteLevel];
  } else {
    return Response.json({ error: "Invalid targetLevel — must be 'natural', 'formal', or 'c1'" }, { status: 400 });
  }

  const prompt = buildPrompt(sentence, levels, context);

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    let parsed: { variants: RewriteVariant[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[writing/rewrite] JSON parse failed:", cleaned.slice(0, 200));
      return Response.json({ error: "AI response was not valid JSON" }, { status: 502 });
    }

    // AC2: drop variants with no changes (no-op rewrites)
    const variants = (parsed.variants ?? []).filter(
      (v) => v.changes && v.changes.length > 0 && v.rewrite && v.rewrite.trim() !== sentence.trim()
    );

    return Response.json({ variants } satisfies RewriteResponse);
  } catch (err) {
    console.error("[writing/rewrite] Error:", err);
    return Response.json({ error: "Failed to rewrite sentence" }, { status: 502 });
  }
}
