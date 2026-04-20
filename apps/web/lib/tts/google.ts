const VOICES = {
  us: "en-US-Chirp3-HD-Aoede",
  uk: "en-GB-Chirp3-HD-Kore",
  au: "en-AU-Chirp3-HD-Leda",
} as const;

export type Accent = keyof typeof VOICES;
export const ACCENTS = Object.keys(VOICES) as readonly Accent[];
export const DEFAULT_ACCENT: Accent = "us";

export function parseAccent(value: unknown): Accent {
  return value === "uk" || value === "au" || value === "us" ? value : DEFAULT_ACCENT;
}

export async function synthesizeGoogleTts(args: {
  text: string;
  accent: Accent;
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_TTS_API_KEY");

  const voice = VOICES[args.accent];
  const languageCode = voice.split("-").slice(0, 2).join("-");
  const speakingRate = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: args.text },
        voice: { languageCode, name: voice },
        audioConfig: { audioEncoding: "MP3", speakingRate },
      }),
      signal: args.signal,
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google TTS ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) throw new Error("Google TTS: empty audioContent");
  const buf = Buffer.from(data.audioContent, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
