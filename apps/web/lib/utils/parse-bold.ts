export type BoldSegment = { text: string; bold: boolean };

export function parseBold(text: string): BoldSegment[] {
  if (!text) return [];
  const parts = text.split(/\*\*(.+?)\*\*/);
  const segments: BoldSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== "") {
      segments.push({ text: parts[i], bold: i % 2 === 1 });
    }
  }
  return segments;
}
