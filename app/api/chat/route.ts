// app/api/chat/route.ts

// Import 'streamText' (for reading token-by-token) and 'convertToModelMessages' (for message formatting) from the Vercel AI SDK
import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

const CO_MINH_SYSTEM_PROMPT = `
# BLOCK 1 — IDENTITY
You are "Cô Minh", a legendary Vietnamese English teacher, but also a friendly conversational partner.
You studied abroad in Australia and are extremely proud of it (you bring it up occasionally).
You genuinely care about the user. Depending on the user's intent, you can switch between being a strict-but-funny teacher and a normal friend casually chatting about life.

# BLOCK 2 — TWO ROLES
Role 1: The Teacher & Guide
- If the user asks HOW to learn English, give them practical, actionable, and modern study advice (podcasts, shadow speaking, etc.).
- When a student makes a grammar mistake: TEASE first → CORRECT it → EXPLAIN WHY. Then move on.
- Correction format: [Tease] "Trời ơi..." → [Correct] "Phải nói là..." → [Explain] "Vì..."

Role 2: The Casual Conversationalist
- If the user just wants to chat (about weather, hobbies, daily life, work, etc.), respond like a normal person having a conversation.
- Answer their questions, share your (fictional) opinions, and ASK them questions back to keep the conversation flowing.
- DO NOT force a grammar lesson if they are just having a smooth casual chat and only made a minor typo. 

# BLOCK 3 — COMMUNICATION RULES
- Mix English and Vietnamese naturally (Vietglish), roughly 70% English, 30% Vietnamese.
- Signature Vietnamese expressions: "Trời ơi", "Ủa", "Ồ", "Thôi được"
- ALWAYS use emojis: 🙄 📚 🎊 😤 🥲 ✨
- Keep responses concise and natural — no robotic walls of text.

# BLOCK 4 — CATCHPHRASES & EXAMPLES
- Giving advice: "Học ngoại ngữ là phải lỳ, không lướt TikTok nữa mà nghe podcast đi nha! 🎧"
- Wrong tense: "Tenses lại sai nữa! PAST tense, không phải PASTA tense! 🍝"
- Flex moment (use occasionally): "Hồi cô du học Úc, người ta khen cô nói tiếng Anh như native đó nha! 💅"

# BLOCK 5 — BOUNDARIES
- You are free to talk about ANY topic the user brings up (food, movies, relationships, tech). You are their friend.
- Never be mean-spirited — the teasing is always loving.
- Actively ask questions to keep the English conversation alive.
`;

// A function to handle API errors and return a friendly persona-driven response instead of raw code errors
function getFriendlyErrorMessage(error: unknown): string {
  return `😤 Cô Minh đang gặp chút trục trặc kỹ thuật rồi. Trò ráng chờ lát nữa quay lại học tiếp nha! 🥲`;
}

export async function POST(req: Request) {
  // Use a try/catch block to correctly handle any potential runtime errors
  try {
    // Parse JSON from the HTTP Request Body.
    // Extracts the "messages" array (chat history)
    const { messages } = await req.json();

    // Context Window Management: Cut the array length.
    // We keep only the 20 most recent messages to optimize token cost and prevent exceeding AI memory limits
    const context = messages.slice(-20);

    // Initialize AI SDK streaming by calling OpenAI's API
    const result = await streamText({
      // Specify the model ('gpt-4o-mini') as it is fast and cost-effective
      model: openai("gpt-4o-mini"),
      // Inject the persona instructions as the system prompt
      system: CO_MINH_SYSTEM_PROMPT,
      // MANDATORY in AI SDK v6: Transform the UI format 'messages' into the Core format that OpenAI actually understands
      messages: await convertToModelMessages(context),
    });

    // Convert the raw token stream into an SSE (Server-Sent Events) response designed for the useChat() frontend hook
    return result.toUIMessageStreamResponse({
      // If the streaming disconnects or fails mid-way, attach our friendly error message into the UI stream
      onError: (error) => getFriendlyErrorMessage(error),
    });
  } catch (error) {
    // If the code crashes BEFORE streamText can execute (e.g. req.json() fails, instant network failure)

    // Log the actual raw error to the server console so developers can easily track bugs
    console.error("Chat API error:", error);

    // Get the persona-driven error message
    const friendlyMessage = getFriendlyErrorMessage(error);

    // Manually construct and return an SSE HTTP Response.
    // This tricks the frontend (Browser) into thinking the AI system successfully sent a text message (which is actually an error message),
    // therefore preventing a blank screen crash or a raw Status 500 error display on the client interface.
    return new Response(
      `data: {"type":"text-start","id":"err-1"}\n\ndata: {"type":"text-delta","textDelta":${JSON.stringify(friendlyMessage)}}\n\ndata: {"type":"text-finish","id":"err-1"}\n\ndata: {"type":"finish","finishReason":"error"}\n\ndata: [DONE]\n\n`,
      {
        status: 200, // Return HTTP 200 (Success) so the frontend useChat() hook processes the manual stream above without throwing hard errors
        headers: {
          "Content-Type": "text/event-stream", // Required MIME type for Server-Sent Events (streaming apps)
          "Cache-Control": "no-cache", // Prevent the browser from cashing the streaming data
          "X-Accel-Buffering": "no", // Disable reverse-proxy buffering (like Nginx) to ensure tokens stream instantly
        },
      },
    );
  }
}
