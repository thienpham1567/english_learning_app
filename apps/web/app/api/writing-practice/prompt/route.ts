import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("writing-practice/prompt");

import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { PromptRequestSchema } from "@/lib/writing-practice/schema";

const PROMPT_INSTRUCTIONS: Record<string, string> = {
  "sentence-picture":
    "Generate a realistic TOEIC Writing Q1-Q5 style prompt. Describe a workplace or daily-life picture scenario (e.g., people in an office, a meeting room, a café, a train station) and provide 2 required words that must be used in the sentence. Ask the student to write 1-2 grammatically correct sentences describing the scene using those words.",
  "email-response":
    "Generate a realistic TOEIC Writing Q6-Q7 style prompt. Present a business email (include sender name, subject line, and body) that the student must respond to with at least 80 words. The email should contain 2-3 specific points to address in the reply. Topics should be workplace-related: meeting scheduling, project updates, office policies, event planning, customer feedback, etc.",
  "opinion-essay":
    "Generate a realistic TOEIC Writing Q8 style prompt. Present a statement or question about a common TOEIC topic (workplace policies, technology in business, work-life balance, remote work, professional development, team management) and ask the student to write an opinion essay of at least 200 words with reasons and examples.",
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
          content: `You are a TOEIC Writing prompt generator for English learners. ${PROMPT_INSTRUCTIONS[category]} Return ONLY the prompt text, no JSON wrapping, no instructions.`,
        },
        {
          role: "user",
          content: `Generate one TOEIC Writing prompt for category: ${category}`,
        },
      ],
    });

    const prompt = completion.choices[0]?.message?.content?.trim();
    if (!prompt) {
      return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
    }

    return Response.json({ prompt });
  } catch (err) {
    log.error({ err }, "writing-practice.prompt.generate.failed");
    return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
  }
}
