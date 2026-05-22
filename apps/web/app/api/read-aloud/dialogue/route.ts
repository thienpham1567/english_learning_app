import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("read-aloud/dialogue");

const OPENAI_TIMEOUT_MS = 25_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

const DIALOGUE_TOPICS = [
  // Daily life
  "morning routine and getting ready for work",
  "grocery shopping at the supermarket",
  "cooking dinner together at home",
  "doing household chores and cleaning",
  "walking the dog in the park",
  "chatting with a neighbor about the weather",
  "picking up kids from school",
  "planning meals for the week",
  // Social
  "catching up with an old friend at a café",
  "meeting someone new at a party",
  "planning a birthday surprise for a friend",
  "discussing weekend plans with roommates",
  "inviting friends over for a barbecue",
  "talking about a movie you just watched",
  // Work & school
  "first day at a new job",
  "discussing a project at work",
  "asking a teacher for help after class",
  "team meeting about a deadline",
  "small talk with coworkers during lunch break",
  // Shopping & services
  "ordering food at a restaurant",
  "shopping for clothes at the mall",
  "returning a product at customer service",
  "getting a haircut at the salon",
  "calling to fix an internet problem",
  // Travel & transport
  "asking for directions in a city",
  "checking in at a hotel",
  "taking a taxi to the airport",
  "renting a car for a road trip",
  "booking a table at a restaurant by phone",
  // Health & fitness
  "making a doctor's appointment",
  "talking to a pharmacist about medicine",
  "discussing workout routines at the gym",
  "visiting a dentist for a checkup",
  // Home & living
  "looking for an apartment to rent",
  "discussing bills and expenses with a partner",
  "calling a plumber to fix a leak",
  "decorating a new room together",
  // Fun & hobbies
  "planning a vacation with friends",
  "talking about a new hobby or interest",
  "discussing what to watch on Netflix tonight",
  "sharing recipes and cooking tips",
];

const LENGTH_CONFIG: Record<string, { linesRange: string; desc: string }> = {
  short: { linesRange: "4-6", desc: "Quick exchange" },
  medium: { linesRange: "8-12", desc: "Standard conversation" },
  long: { linesRange: "14-20", desc: "Extended dialogue" },
};

/**
 * POST /api/read-aloud/dialogue
 *
 * Generate a multi-speaker dialogue for listening and role-play practice.
 *
 * Body: { topic?: string, speakers?: 2|3, length?: "short"|"medium"|"long" }
 * Returns: { title, context, lines: Array<{ speaker, name, text }> }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
      return Response.json({ error: "Quá giới hạn. Vui lòng thử lại sau." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    speakers?: number;
    length?: string;
  } | null;

  const speakers = body?.speakers === 3 ? 3 : 2;
  const length = body?.length && LENGTH_CONFIG[body.length] ? body.length : "medium";
  const { linesRange } = LENGTH_CONFIG[length];

  const shuffledTopics = [...DIALOGUE_TOPICS].sort(() => Math.random() - 0.5).slice(0, 6);
  const topicInstruction = body?.topic?.trim()
    ? `Topic: ${body.topic.trim()}`
    : `Pick ONE random topic from this list: ${shuffledTopics.join(", ")}`;

  // Pick speaker names from actual TTS voice names for consistency
  const VOICE_NAMES = [
    { name: "Austin", gender: "m", accent: "US" },
    { name: "Autumn", gender: "f", accent: "US" },
    { name: "Daniel", gender: "m", accent: "UK" },
    { name: "Diana", gender: "f", accent: "UK" },
    { name: "Troy", gender: "m", accent: "AU" },
    { name: "Hannah", gender: "f", accent: "AU" },
  ];

  // Shuffle and pick, alternating genders for natural dialogue
  const shuffled = [...VOICE_NAMES].sort(() => Math.random() - 0.5);
  const picked: typeof VOICE_NAMES = [];
  const genders = new Set<string>();
  for (const v of shuffled) {
    if (picked.length >= speakers) break;
    // Prefer mixed genders
    if (picked.length === 0 || !genders.has(v.gender) || picked.length === speakers - 1) {
      picked.push(v);
      genders.add(v.gender);
    }
  }
  // Fill if not enough (fallback)
  while (picked.length < speakers) {
    const remaining = shuffled.find((v) => !picked.includes(v));
    if (remaining) picked.push(remaining);
    else break;
  }

  const speakerLabels = ["A", "B", "C"];
  const speakerNames = picked
    .map((v, i) => `Speaker ${speakerLabels[i]} (name: ${v.name})`)
    .join(", ");

  const speakerExamples = picked
    .map((v, i) => `    { "speaker": "${speakerLabels[i]}", "name": "${v.name}", "text": "English dialogue line..." }`)
    .join(",\n");

  const prompt = `Generate a natural ENGLISH conversation between ${speakers} people for language learning practice.

${topicInstruction}

CRITICAL: All dialogue lines in "text" fields MUST be in ENGLISH. Only "title" and "context" are in Vietnamese.

Requirements:
- Exactly ${speakers} speakers: ${speakerNames}
- ${linesRange} dialogue turns total
- Write like REAL people talk — not textbook dialogues
- Each turn can be 1 to 5 sentences depending on context. Some turns are short reactions ("Oh really? That's great!"), while others are longer explanations, stories, or opinions. Vary the length naturally.
- Include natural speech patterns: filler words (well, you know, I mean), reactions (wow, oh, hmm), interruptions, follow-up questions
- Speakers should share personal experiences, opinions, and ask each other questions
- Vocabulary level: B1-B2 (intermediate English learner friendly)
- Make it feel like overhearing a real conversation between friends or colleagues
- "title": a Vietnamese title describing the scene
- "context": a brief Vietnamese context description (1 sentence)
- "text": MUST BE IN ENGLISH — this is for English listening practice

Return ONLY valid JSON:
{
  "title": "Tiêu đề tiếng Việt",
  "context": "Mô tả ngữ cảnh bằng tiếng Việt (1 câu)",
  "lines": [
${speakerExamples}
  ]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openAiClient.chat.completions.create(
      {
        model: openAiConfig.chatModel,
        messages: [
          { role: "system", content: "You are a dialogue writer for English learning apps. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      log.error({ preview: cleaned.slice(0, 120) }, "dialogue.json.parse.failed");
      return Response.json({ error: "Không thể tạo hội thoại. Vui lòng thử lại." }, { status: 502 });
    }

    const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
    const lines = rawLines
      .filter((l): l is Record<string, unknown> =>
        typeof l === "object" && l !== null && typeof (l as Record<string, unknown>).text === "string",
      )
      .map((l) => ({
        speaker: String(l.speaker ?? "A"),
        name: String(l.name ?? "Speaker"),
        text: String(l.text).trim(),
      }))
      .slice(0, 25);

    if (lines.length < 2) {
      log.error({ parsed }, "dialogue.empty");
      return Response.json({ error: "Không thể tạo hội thoại." }, { status: 502 });
    }

    log.info({ userId, speakers, length, lines: lines.length }, "dialogue.generated");

    return Response.json({
      title: String(parsed.title ?? "Hội thoại").slice(0, 100),
      context: String(parsed.context ?? "").slice(0, 200),
      lines,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    log.error({ err, aborted }, aborted ? "dialogue.timeout" : "dialogue.error");
    return Response.json(
      { error: aborted ? "Tạo hội thoại quá thời gian." : "Không thể tạo hội thoại" },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
