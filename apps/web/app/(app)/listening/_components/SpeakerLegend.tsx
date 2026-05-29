"use client";

import type { DialogueTurnPayload } from "@/lib/listening/types";

const SPEAKER_COLORS: Record<"A" | "B" | "C", string> = {
  A: "var(--accent)",
  B: "var(--xp)",
  C: "var(--success)",
};

const SPEAKER_BG: Record<"A" | "B" | "C", string> = {
  A: "bg-accent",
  B: "bg-[var(--xp)]",
  C: "bg-[var(--success)]",
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
 * Example: "A = US · autumn, B = UK · daniel".
 */
export function SpeakerLegend({ turns }: Props) {
  const seen = new Map<"A" | "B" | "C", DialogueTurnPayload>();
  for (const t of turns) {
    if (!seen.has(t.speaker)) seen.set(t.speaker, t);
  }
  const entries = Array.from(seen.entries());
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 py-2 px-3 bg-surface border-2 border-border rounded-lg text-xs">
      <span className="text-text-muted font-semibold">Speakers:</span>
      {entries.map(([id, turn]) => (
        <span key={id} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-lg text-[11px] font-bold text-ink ${SPEAKER_BG[id]}`}
          >
            {id}
          </span>
          <span className="text-text-primary">{describeVoice(turn)}</span>
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
    <div className="flex flex-col gap-2.5">
      {turns.map((t, i) => (
        <div key={i} className="flex gap-2.5 items-start">
          <span
            className={`inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg text-xs font-bold text-ink shrink-0 ${SPEAKER_BG[t.speaker]}`}
          >
            {t.speaker}
          </span>
          <div className="text-sm leading-relaxed text-text-primary">
            <span className="text-[11px] text-text-muted mr-1.5">
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
