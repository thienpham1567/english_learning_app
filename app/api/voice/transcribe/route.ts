import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * POST /api/voice/transcribe
 *
 * Receives audio blob from the client and transcribes it using OpenAI Whisper API.
 * Returns the transcribed text.
 *
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
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Forward to OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "en");
    whisperForm.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Whisper] Error:", response.status, errorText);
      return Response.json({ error: "Transcription failed" }, { status: 502 });
    }

    const result = (await response.json()) as { text: string };
    return Response.json({ text: result.text });
  } catch (err) {
    console.error("[Whisper] Unexpected error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
