export type MockQuestion = {
  type: string;
  passage?: string | null;
  stem: string;
  options: string[] | null;
  correctIndex: number | null;
  correctAnswer?: string | null;
  explanationEn: string;
  explanationVi: string;
  topic: string;
};

export type TestState = "idle" | "loading" | "active" | "review";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isFillBlank(type: string): boolean {
  return type === "fill-blank" || type === "fill_blank";
}
