
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
  accentLabel: string;
  description: string;
}

export const VOICES: VoiceOption[] = [
  { accent: "us", gender: "m", role: "us-m", label: "US Male", name: "Austin", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nam trầm ấm, phát âm rõ ràng chuẩn Mỹ." },
  { accent: "us", gender: "f", role: "us-f", label: "US Female", name: "Autumn", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nữ tự nhiên, biểu cảm, dễ nghe." },
  { accent: "uk", gender: "m", role: "uk-m", label: "UK Male", name: "Daniel", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nam Anh quý phái, thanh lịch, chuẩn mực." },
  { accent: "uk", gender: "f", role: "uk-f", label: "UK Female", name: "Diana", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nữ Anh ngọt ngào, tinh tế, truyền cảm." },
  { accent: "au", gender: "m", role: "au-m", label: "AU Male", name: "Troy", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nam Úc hào sảng, phóng khoáng, tự nhiên." },
  { accent: "au", gender: "f", role: "au-f", label: "AU Female", name: "Hannah", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nữ Úc nhẹ nhàng, êm dịu, dễ đồng điệu." },
];

export const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

export function getVoiceByRole(role: string): VoiceOption {
  return VOICES.find((v) => v.role === role) ?? VOICES[0];
}
