import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("writing-practice/example");

const ExampleRequestSchema = z.object({
  category: z.enum(["sentence-picture", "email-response", "opinion-essay"]),
  prompt: z.string().min(1),
});

const GENERATE_EXAMPLE_PROMPT = `You are an expert TOEIC Writing instructor with 15+ years of experience.
Generate a HIGH-SCORING model answer for the given TOEIC Writing task.

## TOEIC Writing Task Types

### sentence-picture (Q1-Q5, Score: 0-3)
- Write ONE or TWO grammatically correct sentences using the given words
- The sentence must accurately describe the picture/scenario
- Score 3 criteria: correct grammar, relevant to picture, uses required words naturally
- Target: 20-40 words

### email-response (Q6-Q7, Score: 0-4)
- Respond to a business email addressing ALL points mentioned
- Use appropriate business tone and email formatting
- Include: greeting, body addressing each point, polite closing
- Score 4 criteria: addresses all points, appropriate tone, clear organization, correct grammar
- Target: 120-150 words

### opinion-essay (Q8, Score: 0-5)
- Express and support your opinion with reasons and examples
- Use clear paragraph structure (intro → body paragraphs → conclusion)
- Include real-world examples and personal experience where relevant
- Score 5 criteria: clear position, supporting reasons, relevant examples, organization, grammar/vocabulary range
- Target: 250-300 words

## Writing Style Guidelines
- Use natural, professional English (not overly academic)
- Vocabulary appropriate for B1-B2 level (accessible but not basic)
- Vary sentence structures (simple, compound, complex)
- Use transition words naturally (however, moreover, in addition, for instance)
- For emails: use standard business email conventions
- For essays: use clear topic sentences and supporting details

## Response Format
Return ONLY valid JSON:
{
  "example": "The complete model answer text",
  "taskType": "sentence-picture | email-response | opinion-essay",
  "wordCount": <number>,
  "keyTechniques": [
    "Brief note on a writing technique demonstrated in this example"
  ],
  "vocabularyHighlights": [
    { "term": "word or phrase used", "explanation": "why it is effective here" }
  ],
  "structureNotes": "Brief explanation of how the answer is organized"
}`;

// Rate limiter: 5 per minute
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
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = ExampleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, prompt } = parsed.data;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: GENERATE_EXAMPLE_PROMPT },
        {
          role: "user",
          content: `Task type: ${category}\n\nPrompt:\n${prompt}\n\nGenerate a high-scoring model answer.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return Response.json({ error: "Failed to generate example" }, { status: 502 });
    }

    const json = JSON.parse(content);
    return Response.json(json);
  } catch (err) {
    log.error({ err }, "writing-practice.example.generate.failed");
    return Response.json({ error: "Failed to generate example" }, { status: 502 });
  }
}
