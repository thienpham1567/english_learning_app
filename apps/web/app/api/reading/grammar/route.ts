import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { BoundedCache } from "@/lib/reading/utils";

const grammarCache = new BoundedCache<unknown>(500, 24 * 60 * 60 * 1000); // 500 entries, 24h TTL

function hashParagraph(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/**
 * POST /api/reading/grammar
 * Analyze grammar patterns in a paragraph using AI.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const paragraph = body.paragraph as string;

  // Input validation — prevent prompt injection and excessive token costs
  if (!paragraph || paragraph.length < 10 || paragraph.length > 2000) {
    return Response.json({ patterns: [] });
  }

  const cacheKey = hashParagraph(paragraph);
  const cached = grammarCache.get(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    const systemPrompt = `You are an English grammar analyzer for Vietnamese TOEIC/IELTS learners.
Analyze the given paragraph and identify up to 4 important grammar patterns.

For each pattern, provide:
- name: English grammar pattern name (e.g., "Present Perfect", "Passive Voice", "Relative Clause")
- explanation: Brief Vietnamese explanation of this pattern and why it's used here
- phrase: The exact phrase from the paragraph that demonstrates this pattern
- color: One of "green" (tenses), "blue" (modifiers/adverbs), "yellow" (clauses), "purple" (passive/conditional)

Respond with valid JSON only: { "patterns": [...] }
If no notable patterns found, return { "patterns": [] }`;

    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: paragraph },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? '{"patterns":[]}';
    const data = JSON.parse(content);

    grammarCache.set(cacheKey, data);

    return Response.json(data);
  } catch (err) {
    console.error("[Grammar] Analysis error:", err);
    return Response.json({ patterns: [] });
  }
}
