/* ── Voice configuration — multi-provider ── */
export type Accent = "us" | "uk" | "au";
export type Gender = "m" | "f";
export type TtsProvider = "groq" | "kokoro";

export interface VoiceOption {
  accent: Accent;
  gender: Gender;
  role: string;
  label: string;
  name: string;
  flag: string;
  avatar: string;
  accentLabel: string;
  description: string;
  provider: TtsProvider;
  /** Provider-specific voice ID sent to API */
  voiceId: string;
}

/* ── Groq Orpheus voices ── */
export const GROQ_VOICES: VoiceOption[] = [
  {
    accent: "us",
    gender: "m",
    role: "groq-austin",
    label: "US Male",
    name: "Austin",
    flag: "🇺🇸",
    avatar: "/avatars/austin.png",
    accentLabel: "American",
    description: "Warm male voice with clear American pronunciation.",
    provider: "groq",
    voiceId: "austin",
  },
  {
    accent: "us",
    gender: "f",
    role: "groq-autumn",
    label: "US Female",
    name: "Autumn",
    flag: "🇺🇸",
    avatar: "/avatars/autumn.png",
    accentLabel: "American",
    description: "Natural and expressive female voice, easy to understand.",
    provider: "groq",
    voiceId: "autumn",
  },
  {
    accent: "uk",
    gender: "m",
    role: "groq-daniel",
    label: "UK Male",
    name: "Daniel",
    flag: "🇬🇧",
    avatar: "/avatars/daniel.png",
    accentLabel: "British",
    description: "Sophisticated and elegant British male voice.",
    provider: "groq",
    voiceId: "daniel",
  },
  {
    accent: "uk",
    gender: "f",
    role: "groq-diana",
    label: "UK Female",
    name: "Diana",
    flag: "🇬🇧",
    avatar: "/avatars/diana.png",
    accentLabel: "British",
    description: "Sweet and expressive British female voice.",
    provider: "groq",
    voiceId: "diana",
  },
  {
    accent: "au",
    gender: "m",
    role: "groq-troy",
    label: "AU Male",
    name: "Troy",
    flag: "🇦🇺",
    avatar: "/avatars/troy.png",
    accentLabel: "Australian",
    description: "Friendly and natural Australian male voice.",
    provider: "groq",
    voiceId: "troy",
  },
  {
    accent: "au",
    gender: "f",
    role: "groq-hannah",
    label: "AU Female",
    name: "Hannah",
    flag: "🇦🇺",
    avatar: "/avatars/hannah.png",
    accentLabel: "Australian",
    description: "Soft and gentle Australian female voice.",
    provider: "groq",
    voiceId: "hannah",
  },
];

/* ── Kokoro voices (self-hosted) ── */
export const KOKORO_VOICES: VoiceOption[] = [
  {
    accent: "us",
    gender: "f",
    role: "kokoro-af_heart",
    label: "US Female",
    name: "Heart",
    flag: "🇺🇸",
    avatar: "/avatars/kokoro-heart.png",
    accentLabel: "American",
    description: "Natural and warm American female voice. Kokoro's most popular voice.",
    provider: "kokoro",
    voiceId: "af_heart",
  },
  {
    accent: "us",
    gender: "f",
    role: "kokoro-af_bella",
    label: "US Female",
    name: "Bella",
    flag: "🇺🇸",
    avatar: "/avatars/kokoro-bella.png",
    accentLabel: "American",
    description: "Soft and elegant American female voice.",
    provider: "kokoro",
    voiceId: "af_bella",
  },
  {
    accent: "us",
    gender: "f",
    role: "kokoro-af_sky",
    label: "US Female",
    name: "Sky",
    flag: "🇺🇸",
    avatar: "/avatars/kokoro-sky.png",
    accentLabel: "American",
    description: "Bright and clear American female voice.",
    provider: "kokoro",
    voiceId: "af_sky",
  },
  {
    accent: "us",
    gender: "m",
    role: "kokoro-am_adam",
    label: "US Male",
    name: "Adam",
    flag: "🇺🇸",
    avatar: "/avatars/kokoro-adam.png",
    accentLabel: "American",
    description: "Deep and confident American male voice.",
    provider: "kokoro",
    voiceId: "am_adam",
  },
  {
    accent: "us",
    gender: "m",
    role: "kokoro-am_michael",
    label: "US Male",
    name: "Michael",
    flag: "🇺🇸",
    avatar: "/avatars/kokoro-michael.png",
    accentLabel: "American",
    description: "Warm and friendly American male voice.",
    provider: "kokoro",
    voiceId: "am_michael",
  },
  {
    accent: "uk",
    gender: "f",
    role: "kokoro-bf_emma",
    label: "UK Female",
    name: "Emma",
    flag: "🇬🇧",
    avatar: "/avatars/kokoro-emma.png",
    accentLabel: "British",
    description: "Refined and articulate British female voice.",
    provider: "kokoro",
    voiceId: "bf_emma",
  },
  {
    accent: "uk",
    gender: "m",
    role: "kokoro-bm_george",
    label: "UK Male",
    name: "George",
    flag: "🇬🇧",
    avatar: "/avatars/kokoro-george.png",
    accentLabel: "British",
    description: "Classic and distinguished British male voice.",
    provider: "kokoro",
    voiceId: "bm_george",
  },
];

/** Legacy VOICES — backward compat (Groq voices with old role format) */
export const VOICES: VoiceOption[] = GROQ_VOICES.map((v) => ({
  ...v,
  // Remap role to old format for backward compat
  role: `${v.accent}-${v.gender}`,
}));

export const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

export function getVoiceByRole(role: string): VoiceOption {
  // Search in all voices
  const all = [...GROQ_VOICES, ...KOKORO_VOICES, ...VOICES];
  return all.find((v) => v.role === role) ?? VOICES[0];
}

export function getVoicesByProvider(provider: TtsProvider): VoiceOption[] {
  return provider === "groq" ? GROQ_VOICES : KOKORO_VOICES;
}
