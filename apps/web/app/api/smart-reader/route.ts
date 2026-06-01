import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("smart-reader");

const MAX_INPUT_LENGTH = 3000;

const SYSTEM_PROMPT = `You are a premium English-to-Vietnamese reading comprehension assistant. Your job is to help Vietnamese learners deeply understand English text.

Given an English text, respond with a JSON object containing:

1. "naturalTranslation": A natural, fluent Vietnamese translation. NOT word-by-word. Translate as a native Vietnamese speaker would express the same idea. Use natural Vietnamese word order and phrasing.

2. "breakdown": An array of key phrases/patterns worth explaining. Each item has:
   - "phrase": the English phrase (exact from the text)
   - "meaning": Vietnamese meaning
   - "note": grammar pattern, formality level, or usage tip (in Vietnamese)
   Focus on: idioms, phrasal verbs, complex structures, formal/informal markers, connectors.

3. "vocabulary": An array of important words. Each item has:
   - "word": the English word
   - "pos": part of speech (noun, verb, adj, adv, etc.)
   - "meaning": Vietnamese meaning
   - "example": a simple example sentence using this word

4. "difficultyLevel": "beginner" | "intermediate" | "advanced" based on the text complexity

5. "readingTips": One brief tip in Vietnamese about a pattern or technique from this text that helps reading comprehension.

Rules:
- All Vietnamese output must be natural, colloquial Vietnamese — not robotic translation
- Keep breakdown to 3-6 most important phrases (not every word)
- Keep vocabulary to 4-8 most useful words
- Respond ONLY with valid JSON, no markdown, no explanation outside JSON`;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string") {
    return Response.json({ error: "Missing text field" }, { status: 400 });
  }

  const text = body.text.trim();
  if (text.length > MAX_INPUT_LENGTH) {
    return Response.json(
      { error: `Text too long. Maximum ${MAX_INPUT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.smartReaderModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from model");
    }

    // Strip markdown code fences if model wraps JSON in ```json ... ```
    let jsonStr = raw.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?\s*```\s*$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      log.error({ raw: raw.slice(0, 500) }, "smart-reader.json.parse.failed");
      return Response.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 },
      );
    }

    // Ensure required fields exist
    const result = {
      naturalTranslation: parsed.naturalTranslation || "",
      breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      difficultyLevel: parsed.difficultyLevel || "intermediate",
      readingTips: parsed.readingTips || "",
    };

    return Response.json(result);
  } catch (err) {
    log.error({ err }, "smart-reader.analysis.failed");

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("429") || message.includes("rate")) {
      return Response.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
