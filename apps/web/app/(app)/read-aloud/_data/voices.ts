/* ── Voice configuration — Groq Orpheus + ElevenLabs ── */
export type Accent = "us" | "uk" | "au";
export type Gender = "m" | "f";
export type TtsProvider = "groq" | "elevenlabs";

export interface VoiceOption {
  accent: Accent;
  gender: Gender;
  /** Unique role key, e.g. "groq-us-m" or "el-rachel" */
  role: string;
  label: string;
  name: string;
  flag: string;
  avatar: string;
  accentLabel: string;
  description: string;
  provider: TtsProvider;
  /** Provider-native voice ID sent to the API */
  voiceId: string;
}

/* ── Groq Orpheus: 6 voices (US + UK + AU) ── */
export const GROQ_VOICES: VoiceOption[] = [
  {
    accent: "us", gender: "m", role: "groq-us-m",
    label: "US Male", name: "Austin", flag: "🇺🇸",
    avatar: "/avatars/austin.png", accentLabel: "American",
    description: "Warm male voice with clear American pronunciation.",
    provider: "groq", voiceId: "austin",
  },
  {
    accent: "us", gender: "f", role: "groq-us-f",
    label: "US Female", name: "Autumn", flag: "🇺🇸",
    avatar: "/avatars/autumn.png", accentLabel: "American",
    description: "Natural and expressive female voice, easy to understand.",
    provider: "groq", voiceId: "autumn",
  },
  {
    accent: "uk", gender: "m", role: "groq-uk-m",
    label: "UK Male", name: "Daniel", flag: "🇬🇧",
    avatar: "/avatars/daniel.png", accentLabel: "British",
    description: "Sophisticated and elegant British male voice.",
    provider: "groq", voiceId: "daniel",
  },
  {
    accent: "uk", gender: "f", role: "groq-uk-f",
    label: "UK Female", name: "Diana", flag: "🇬🇧",
    avatar: "/avatars/diana.png", accentLabel: "British",
    description: "Sweet and expressive British female voice.",
    provider: "groq", voiceId: "diana",
  },
  {
    accent: "au", gender: "m", role: "groq-au-m",
    label: "AU Male", name: "Troy", flag: "🇦🇺",
    avatar: "/avatars/troy.png", accentLabel: "Australian",
    description: "Friendly and natural Australian male voice.",
    provider: "groq", voiceId: "troy",
  },
  {
    accent: "au", gender: "f", role: "groq-au-f",
    label: "AU Female", name: "Hannah", flag: "🇦🇺",
    avatar: "/avatars/hannah.png", accentLabel: "Australian",
    description: "Soft and gentle Australian female voice.",
    provider: "groq", voiceId: "hannah",
  },
];

/* ── ElevenLabs: 4 premade voices ── */
export const ELEVENLABS_VOICES: VoiceOption[] = [
  {
    accent: "us", gender: "f", role: "el-rachel",
    label: "US Female", name: "Rachel", flag: "🇺🇸",
    avatar: "/avatars/autumn.png", accentLabel: "American",
    description: "Calm and warm American female voice. Great for narration.",
    provider: "elevenlabs", voiceId: "21m00Tcm4TlvDq8ikWAM",
  },
  {
    accent: "us", gender: "m", role: "el-drew",
    label: "US Male", name: "Drew", flag: "🇺🇸",
    avatar: "/avatars/austin.png", accentLabel: "American",
    description: "Well-rounded and confident American male voice.",
    provider: "elevenlabs", voiceId: "29vD33N1CtxCmqQRPOHJ",
  },
  {
    accent: "us", gender: "m", role: "el-antoni",
    label: "US Male", name: "Antoni", flag: "🇺🇸",
    avatar: "/avatars/daniel.png", accentLabel: "American",
    description: "Young and friendly American male voice.",
    provider: "elevenlabs", voiceId: "ErXwobaYiN019PkySvjV",
  },
  {
    accent: "us", gender: "f", role: "el-bella",
    label: "US Female", name: "Bella", flag: "🇺🇸",
    avatar: "/avatars/diana.png", accentLabel: "American",
    description: "Soft and engaging American female voice.",
    provider: "elevenlabs", voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
];

/** All voices combined */
export const ALL_VOICES: VoiceOption[] = [...GROQ_VOICES, ...ELEVENLABS_VOICES];

/** Legacy VOICES — backward compat (maps to Groq voices with old role format) */
export const VOICES: VoiceOption[] = GROQ_VOICES.map((v) => ({
  ...v,
  role: `${v.accent}-${v.gender}`,
}));

export const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

export function getVoiceByRole(role: string): VoiceOption {
  return ALL_VOICES.find((v) => v.role === role)
    ?? VOICES.find((v) => v.role === role)
    ?? GROQ_VOICES[0];
}

export function getVoicesByProvider(provider: TtsProvider): VoiceOption[] {
  return provider === "elevenlabs" ? ELEVENLABS_VOICES : GROQ_VOICES;
}
