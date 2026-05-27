/* ── Voice configuration ── */
export type Accent = "us" | "uk" | "au";
export type Gender = "m" | "f";

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
}

export const VOICES: VoiceOption[] = [
  {
    accent: "us",
    gender: "m",
    role: "us-m",
    label: "US Male",
    name: "Austin",
    flag: "🇺🇸",
    avatar: "/avatars/austin.png",
    accentLabel: "American",
    description: "Warm male voice with clear American pronunciation.",
  },
  {
    accent: "us",
    gender: "f",
    role: "us-f",
    label: "US Female",
    name: "Autumn",
    flag: "🇺🇸",
    avatar: "/avatars/autumn.png",
    accentLabel: "American",
    description: "Natural and expressive female voice, easy to understand.",
  },
  {
    accent: "uk",
    gender: "m",
    role: "uk-m",
    label: "UK Male",
    name: "Daniel",
    flag: "🇬🇧",
    avatar: "/avatars/daniel.png",
    accentLabel: "British",
    description: "Sophisticated and elegant British male voice.",
  },
  {
    accent: "uk",
    gender: "f",
    role: "uk-f",
    label: "UK Female",
    name: "Diana",
    flag: "🇬🇧",
    avatar: "/avatars/diana.png",
    accentLabel: "British",
    description: "Sweet and expressive British female voice.",
  },
  {
    accent: "au",
    gender: "m",
    role: "au-m",
    label: "AU Male",
    name: "Troy",
    flag: "🇦🇺",
    avatar: "/avatars/troy.png",
    accentLabel: "Australian",
    description: "Friendly and natural Australian male voice.",
  },
  {
    accent: "au",
    gender: "f",
    role: "au-f",
    label: "AU Female",
    name: "Hannah",
    flag: "🇦🇺",
    avatar: "/avatars/hannah.png",
    accentLabel: "Australian",
    description: "Soft and gentle Australian female voice.",
  },
];

export const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

export function getVoiceByRole(role: string): VoiceOption {
  return VOICES.find((v) => v.role === role) ?? VOICES[0];
}
