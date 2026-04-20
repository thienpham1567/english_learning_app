import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/speaking/topic
 *
 * Returns a speaking topic for free-talk practice.
 * Caches last 20 topics per user in-memory to prevent repeats.
 *
 * Body: { level: "a2"|"b1"|"b2"|"c1", examMode?: "toeic"|"ielts" }
 */

const topicCache = new Map<string, string[]>();
const MAX_CACHED = 20;
const MAX_CACHE_USERS = 1000;
const MAX_TOPIC_LEN = 500;
const OPENAI_TIMEOUT_MS = 15_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  a2: "elementary (A2) — simple everyday topics, short sentences",
  b1: "intermediate (B1) — familiar topics, moderate complexity",
  b2: "upper-intermediate (B2) — abstract topics, nuanced opinions",
  c1: "advanced (C1) — complex topics, sophisticated argumentation",
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = Date.now();

  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    level?: string;
    examMode?: string;
  } | null;

  const level = (body?.level ?? "b1").toLowerCase();
  if (!LEVEL_DESCRIPTIONS[level]) {
    return Response.json({ error: "Invalid level (a2, b1, b2, c1)" }, { status: 400 });
  }

  const previousTopics = topicCache.get(userId) ?? [];
  const avoidList = previousTopics.map((t) => `- ${t}`).join("\n");

  const examContext =
    body?.examMode === "toeic"
      ? "Context: business, workplace, professional settings."
      : body?.examMode === "ielts"
        ? "Context: academic, social, general interest topics."
        : "Context: general everyday English.";

  const prompt = `Generate ONE speaking topic for a ${LEVEL_DESCRIPTIONS[level]} English learner.
${examContext}

The topic should be a clear prompt that the learner can speak about for 60-120 seconds.
Include a brief description (1 sentence) to help the learner understand what to talk about.

${avoidList ? `AVOID these recently used topics:\n${avoidList}\n` : ""}
Return ONLY valid JSON:
{ "topic": "The topic prompt text", "description": "Brief description to guide the speaker" }`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openAiClient.chat.completions.create(
      {
        model: openAiConfig.chatModel,
        messages: [
          { role: "system", content: "You are an English speaking practice topic generator. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 200,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "Failed to generate topic" }, { status: 502 });
    }

    const parsed = (parsedUnknown ?? {}) as Record<string, unknown>;
    const topicValue = typeof parsed.topic === "string" ? parsed.topic.trim().slice(0, MAX_TOPIC_LEN) : "";
    const descriptionValue =
      typeof parsed.description === "string" ? parsed.description.trim().slice(0, MAX_TOPIC_LEN) : "";

    if (!topicValue) {
      return Response.json({ error: "Failed to generate topic" }, { status: 502 });
    }

    // Update per-user cache (ring buffer) and prevent unbounded user growth.
    if (topicCache.size >= MAX_CACHE_USERS && !topicCache.has(userId)) {
      const firstKey = topicCache.keys().next().value;
      if (firstKey) topicCache.delete(firstKey);
    }
    const cached = [...(topicCache.get(userId) ?? []), topicValue];
    while (cached.length > MAX_CACHED) cached.shift();
    topicCache.set(userId, cached);

    return Response.json({ topic: topicValue, description: descriptionValue });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[speaking/topic]", aborted ? "timeout" : "error");
    return Response.json(
      { error: aborted ? "Topic generation timed out" : "Failed to generate topic" },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
