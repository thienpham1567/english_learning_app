import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { conversation, message } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { deriveTitle } from "@/lib/chat/derive-title";

const TITLE_INSTRUCTIONS =
  "Generate a concise chat title in Vietnamese or English matching the user's language. " +
  "Max 6 words, no quotes, no trailing punctuation. Capture the core topic. Respond with the title only.";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [conv] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
  if (conv.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({ role: message.role, content: message.content })
    .from(message)
    .where(eq(message.conversationId, id))
    .orderBy(asc(message.createdAt))
    .limit(4);

  if (rows.length === 0) {
    return Response.json({ error: "No messages" }, { status: 400 });
  }

  const transcript = rows
    .map((r) => `${r.role === "user" ? "User" : "Tutor"}: ${r.content}`)
    .join("\n");

  let title: string;
  try {
    const response = await openAiClient.responses.create({
      model: openAiConfig.chatModel,
      instructions: TITLE_INSTRUCTIONS,
      input: transcript,
    });
    const raw = (response.output_text ?? "").trim().replace(/^["']|["']$/g, "");
    title = raw ? deriveTitle(raw) : deriveTitle(rows[0].content);
  } catch (error) {
    console.error("Title generation failed:", error);
    title = deriveTitle(rows[0].content);
  }

  await db
    .update(conversation)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)));

  return Response.json({ id, title });
}
