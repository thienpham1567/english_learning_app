import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * POST /api/voice/transcribe
 *
 * Receives audio blob from the client and transcribes it using Groq Whisper API (free tier).
 * Falls back to OpenAI Whisper if GROQ_API_KEY is not configured.
 *
 * Priority: GROQ_API_KEY → OPENAI_DIRECT_API_KEY
 * Groq free tier: 7,200 requests/day, Whisper Large V3 Turbo (~10x faster than OpenAI).
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine provider: Groq (free) → OpenAI (paid) fallback
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_DIRECT_API_KEY;

  const provider = groqKey
    ? { key: groqKey, url: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo", name: "Groq" }
    : openaiKey
      ? { key: openaiKey, url: "https://api.openai.com/v1/audio/transcriptions", model: "whisper-1", name: "OpenAI" }
      : null;

  if (!provider) {
    return Response.json({ error: "No transcription API key configured (GROQ_API_KEY or OPENAI_DIRECT_API_KEY)" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", provider.model);
    whisperForm.append("language", "en");
    whisperForm.append("response_format", "json");

    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${provider.name} Whisper] Error:`, response.status, errorText);
      return Response.json({ error: "Transcription failed" }, { status: 502 });
    }

    const result = (await response.json()) as { text: string };
    return Response.json({ text: result.text });
  } catch (err) {
    console.error(`[${provider.name} Whisper] Unexpected error:`, err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

