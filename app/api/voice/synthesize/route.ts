import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * POST /api/voice/synthesize
 *
 * Converts text to speech using OpenAI TTS API.
 * Returns audio as an MP3 stream.
 *
 * Body: { text: string, speed?: number }
 * Requires OPENAI_DIRECT_API_KEY env var (direct OpenAI key, not OpenRouter).
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_DIRECT_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_DIRECT_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as { text?: string; speed?: number };
    const text = body.text?.trim();

    if (!text) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    // Limit text length to avoid excessive costs
    if (text.length > 4000) {
      return Response.json({ error: "Text too long (max 4000 chars)" }, { status: 400 });
    }

    const speed = Math.max(0.5, Math.min(body.speed ?? 1.0, 2.0));

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",  // natural female English voice, good for teaching
        input: text,
        speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] Error:", response.status, errorText);
      return Response.json({ error: "Speech synthesis failed" }, { status: 502 });
    }

    // Stream the audio response back
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400", // cache 24h
      },
    });
  } catch (err) {
    console.error("[TTS] Unexpected error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
