import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { PromptRequestSchema } from "@/lib/writing-practice/schema";

const PROMPT_INSTRUCTIONS: Record<string, string> = {
  "email-response":
    "Generate a realistic TOEIC Writing Question 6-7 style prompt. Present an email that the student must respond to with at least 80 words. Include the sender, subject, and 2-3 specific points to address in the reply.",
  "opinion-essay":
    "Generate a realistic TOEIC Writing Question 8 style prompt. Present a statement or question about a common topic (workplace, lifestyle, education, technology) and ask the student to write an opinion essay of at least 200 words with reasons and examples.",
  "describe-picture":
    "Generate a realistic TOEIC Writing Question 1-5 style prompt. Describe a picture scenario (e.g., people in an office, a busy street, a meeting room) and ask the student to write 2-3 sentences describing the scene using specific given words. Minimum 60 words.",
  free:
    "Generate an interesting creative writing prompt suitable for English learners preparing for TOEIC. Topics should relate to workplace, business, daily life, or travel. Minimum 50 words.",
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
      return Response.json(
        { error: "Failed to generate prompt" },
        { status: 502 },
      );
    }

    return Response.json({ prompt });
  } catch (err) {
    console.error("[writing-practice] Prompt generation failed:", err);
    return Response.json(
      { error: "Failed to generate prompt" },
      { status: 502 },
    );
  }
}
