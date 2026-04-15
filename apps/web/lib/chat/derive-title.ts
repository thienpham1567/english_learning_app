export function deriveTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  return trimmed.slice(0, 60).trimEnd() + "…";
}
