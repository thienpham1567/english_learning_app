"use client";

import type { DialogueTurnPayload } from "@/lib/listening/types";

const SPEAKER_COLORS: Record<"A" | "B" | "C", string> = {
  A: "#1677ff",
  B: "#fa8c16",
  C: "#52c41a",
};

function describeVoice(t: DialogueTurnPayload): string {
  const accent = t.accent.toUpperCase();
  return `${accent} · ${t.voiceName}`;
}

type Props = {
  turns: DialogueTurnPayload[];
};

/**
 * Shows the speaker legend for a multi-speaker dialogue.
 * Example: "A = US · celeste, B = UK · briggs".
 */
export function SpeakerLegend({ turns }: Props) {
  const seen = new Map<"A" | "B" | "C", DialogueTurnPayload>();
  for (const t of turns) {
    if (!seen.has(t.speaker)) seen.set(t.speaker, t);
  }
  const entries = Array.from(seen.entries());
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        padding: "8px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Speakers:</span>
      {entries.map(([id, turn]) => (
        <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: SPEAKER_COLORS[id],
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {id}
          </span>
          <span style={{ color: "var(--text)" }}>{describeVoice(turn)}</span>
        </span>
      ))}
    </div>
  );
}

type TranscriptProps = {
  turns: DialogueTurnPayload[];
};

/**
 * Per-turn transcript labeled by speaker. Used after submission.
 */
export function DialogueTranscript({ turns }: TranscriptProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {turns.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: SPEAKER_COLORS[t.speaker],
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {t.speaker}
          </span>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>
              ({t.accent.toUpperCase()} · {t.voiceName})
            </span>
            {t.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export { SPEAKER_COLORS };
