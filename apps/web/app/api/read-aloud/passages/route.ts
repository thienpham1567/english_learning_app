import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("read-aloud/passages");

/**
 * POST /api/read-aloud/passages
 *
 * Generate TOEIC-themed read-aloud passages using the AI model.
 *
 * Body: { topic?: string, length?: "short"|"medium"|"long", count?: number }
 */

const OPENAI_TIMEOUT_MS = 20_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

const TOEIC_TOPICS = [
  "office & workplace communication",
  "human resources & recruitment",
  "finance & banking",
  "marketing & advertising",
  "travel & transportation",
  "dining & restaurants",
  "health & wellness",
  "technology & IT",
  "manufacturing & production",
  "real estate & housing",
  "customer service & complaints",
  "business meetings & negotiations",
  "shipping & logistics",
  "entertainment & events",
  "education & training",
];

const LENGTH_CONFIG: Record<string, { wordRange: string; label: string }> = {
  short: { wordRange: "25-40", label: "short" },
  medium: { wordRange: "50-80", label: "medium" },
  long: { wordRange: "100-150", label: "long" },
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = Date.now();

  // Rate limit
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt <= now) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json(
        { error: "Đã vượt giới hạn. Vui lòng thử lại sau." },
        { status: 429 },
      );
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    length?: string;
    count?: number;
  } | null;

  const requestedTopic = body?.topic?.trim() || "";
  const length = body?.length && LENGTH_CONFIG[body.length] ? body.length : "medium";
  const count = Math.min(Math.max(body?.count ?? 3, 1), 5);
  const { wordRange } = LENGTH_CONFIG[length];

  // Pick random topics if not specified
  const topicInstruction = requestedTopic
    ? `Topic: ${requestedTopic}`
    : `Pick ${count} DIFFERENT topics from this list: ${TOEIC_TOPICS.join(", ")}. Each passage should cover a different topic.`;

  const prompt = `You are a TOEIC exam content creator. Generate exactly ${count} English reading passage(s) for read-aloud practice.

${topicInstruction}

Requirements:
- Each passage MUST be ${wordRange} words long (${LENGTH_CONFIG[length].label} length)
- Use natural, professional English commonly found in TOEIC Listening & Reading tests
- Include realistic business scenarios: announcements, memos, emails, notices, advertisements, news reports
- Vocabulary level should match TOEIC test (B1-B2 CEFR)
- NO contractions in formal passages; use full forms (e.g., "do not" instead of "don't")
- Each passage should have a clear Vietnamese title describing its topic
- Include a "topic" field with one of: office, hr, finance, marketing, travel, dining, health, technology, manufacturing, realestate, shipping, meetings, customer_service, entertainment, education

Return ONLY valid JSON array:
[
  {
    "title": "Tiêu đề tiếng Việt ngắn gọn",
    "topic": "topic_key",
    "text": "The English passage text...",
    "wordCount": 65
  }
]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openAiClient.chat.completions.create(
      {
        model: openAiConfig.chatModel,
        messages: [
          {
            role: "system",
            content:
              "You are a professional TOEIC content writer. Generate realistic business English passages for read-aloud practice. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      log.error({ raw }, "read-aloud.passages.parse_error");
      return Response.json(
        { error: "Không thể tạo đoạn văn. Vui lòng thử lại." },
        { status: 502 },
      );
    }

    // Handle both { passages: [...] } and direct array formats
    const passages: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>)?.passages)
        ? (parsed as Record<string, unknown>).passages as unknown[]
        : [];

    if (passages.length === 0) {
      log.error({ parsed }, "read-aloud.passages.empty");
      return Response.json(
        { error: "Không thể tạo đoạn văn. Vui lòng thử lại." },
        { status: 502 },
      );
    }

    // Sanitize & validate each passage
    const TOPIC_ICONS: Record<string, string> = {
      office: "🏢",
      hr: "👥",
      finance: "💰",
      marketing: "📣",
      travel: "✈️",
      dining: "🍽️",
      health: "🏥",
      technology: "💻",
      manufacturing: "🏭",
      realestate: "🏠",
      shipping: "📦",
      meetings: "🤝",
      customer_service: "📞",
      entertainment: "🎭",
      education: "🎓",
    };

    const result = passages
      .filter(
        (p): p is Record<string, unknown> =>
          typeof p === "object" && p !== null && typeof (p as Record<string, unknown>).text === "string",
      )
      .map((p) => {
        const text = String(p.text).trim();
        const topic = String(p.topic ?? "office").toLowerCase().replace(/\s+/g, "_");
        return {
          title: String(p.title ?? "Đoạn văn TOEIC").slice(0, 100),
          topic,
          length,
          icon: TOPIC_ICONS[topic] ?? "📝",
          text,
          wordCount: text.split(/\s+/).length,
        };
      });

    return Response.json({ passages: result });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    log.error(
      { err, aborted },
      aborted ? "read-aloud.passages.timeout" : "read-aloud.passages.error",
    );
    return Response.json(
      {
        error: aborted
          ? "Tạo đoạn văn quá thời gian. Vui lòng thử lại."
          : "Không thể tạo đoạn văn",
      },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
