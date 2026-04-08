import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { PromptRequestSchema } from "@/lib/writing-practice/schema";

const PROMPT_INSTRUCTIONS: Record<string, string> = {
  "ielts-task-1":
    "Generate a realistic IELTS Writing Task 1 prompt. Describe a graph, chart, table, or diagram that the student must summarize in at least 150 words. Include a brief description of what the data shows.",
  "ielts-task-2":
    "Generate a realistic IELTS Writing Task 2 prompt. Present an argumentative or discussion question on a common topic (education, technology, environment, society). The student must write at least 250 words.",
  email:
    "Generate a realistic email writing prompt. Specify whether it is formal or informal, the recipient, and the purpose. The student must write at least 80 words.",
  free:
    "Generate an interesting creative writing prompt suitable for English learners. It can be a story starter, opinion question, or descriptive task. Minimum 50 words.",
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PromptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category } = parsed.data;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are a writing prompt generator for English learners. ${PROMPT_INSTRUCTIONS[category]} Return ONLY the prompt text, no JSON wrapping, no instructions.`,
        },
        {
          role: "user",
          content: `Generate one writing prompt for category: ${category}`,
        },
      ],
    });

    const prompt = completion.choices[0]?.message?.content?.trim();
    if (!prompt) {
      return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
    }

    return Response.json({ prompt });
  } catch (err) {
    console.error("[writing-practice] Prompt generation failed:", err);
    return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
  }
}
