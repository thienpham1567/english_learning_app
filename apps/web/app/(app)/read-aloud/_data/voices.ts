/* ── Voice configuration — Groq Orpheus only ── */
export type Accent = "us" | "uk" | "au";
export type Gender = "m" | "f";

export interface VoiceOption {
  accent: Accent;
  gender: Gender;
  /** Unique role key, e.g. "groq-us-m" */
  role: string;
  label: string;
  name: string;
  flag: string;
  avatar: string;
  accentLabel: string;
  description: string;
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
    voiceId: "austin",
  },
  {
    accent: "us", gender: "f", role: "groq-us-f",
    label: "US Female", name: "Autumn", flag: "🇺🇸",
    avatar: "/avatars/autumn.png", accentLabel: "American",
    description: "Natural and expressive female voice, easy to understand.",
    voiceId: "autumn",
  },
  {
    accent: "uk", gender: "m", role: "groq-uk-m",
    label: "UK Male", name: "Daniel", flag: "🇬🇧",
    avatar: "/avatars/daniel.png", accentLabel: "British",
    description: "Sophisticated and elegant British male voice.",
    voiceId: "daniel",
  },
  {
    accent: "uk", gender: "f", role: "groq-uk-f",
    label: "UK Female", name: "Diana", flag: "🇬🇧",
    avatar: "/avatars/diana.png", accentLabel: "British",
    description: "Sweet and expressive British female voice.",
    voiceId: "diana",
  },
  {
    accent: "au", gender: "m", role: "groq-au-m",
    label: "AU Male", name: "Troy", flag: "🇦🇺",
    avatar: "/avatars/troy.png", accentLabel: "Australian",
    description: "Friendly and natural Australian male voice.",
    voiceId: "troy",
  },
  {
    accent: "au", gender: "f", role: "groq-au-f",
    label: "AU Female", name: "Hannah", flag: "🇦🇺",
    avatar: "/avatars/hannah.png", accentLabel: "Australian",
    description: "Soft and gentle Australian female voice.",
    voiceId: "hannah",
  },
];

/** All voices (Groq only) */
export const ALL_VOICES: VoiceOption[] = GROQ_VOICES;

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
