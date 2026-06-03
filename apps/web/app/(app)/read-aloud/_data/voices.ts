/* ── Voice configuration — per-provider ── */
export type Accent = "us" | "uk" | "au";
export type Gender = "m" | "f";
export type TtsProvider = "groq" | "kokoro";

export interface VoiceOption {
  accent: Accent;
  gender: Gender;
  /** Unique role key, e.g. "groq-us-m" or "kokoro-us-m" */
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

/* ── Kokoro: 4 voices (US + UK only, no AU) ── */
export const KOKORO_VOICES: VoiceOption[] = [
  {
    accent: "us", gender: "m", role: "kokoro-us-m",
    label: "US Male", name: "Adam", flag: "🇺🇸",
    avatar: "/avatars/austin.png", accentLabel: "American",
    description: "Deep and confident American male voice.",
    provider: "kokoro", voiceId: "am_adam",
  },
  {
    accent: "us", gender: "f", role: "kokoro-us-f",
    label: "US Female", name: "Heart", flag: "🇺🇸",
    avatar: "/avatars/autumn.png", accentLabel: "American",
    description: "Natural and warm American female voice. Kokoro's most popular.",
    provider: "kokoro", voiceId: "af_heart",
  },
  {
    accent: "uk", gender: "m", role: "kokoro-uk-m",
    label: "UK Male", name: "George", flag: "🇬🇧",
    avatar: "/avatars/daniel.png", accentLabel: "British",
    description: "Classic and distinguished British male voice.",
    provider: "kokoro", voiceId: "bm_george",
  },
  {
    accent: "uk", gender: "f", role: "kokoro-uk-f",
    label: "UK Female", name: "Emma", flag: "🇬🇧",
    avatar: "/avatars/diana.png", accentLabel: "British",
    description: "Refined and articulate British female voice.",
    provider: "kokoro", voiceId: "bf_emma",
  },
];

/** All voices combined */
export const ALL_VOICES: VoiceOption[] = [...GROQ_VOICES, ...KOKORO_VOICES];

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
  return provider === "groq" ? GROQ_VOICES : KOKORO_VOICES;
}
