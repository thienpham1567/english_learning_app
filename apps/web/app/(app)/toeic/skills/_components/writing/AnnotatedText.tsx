"use client";

import { useState } from "react";
import type { InlineAnnotation } from "@/lib/writing-practice/types";

const TYPE_COLORS: Record<string, string> = {
  grammar:
    "bg-red-500/10 border-b-2 border-red-500 text-red-400 cursor-pointer hover:bg-red-500/20 transition-all px-0.5 rounded-t-sm",
  vocabulary:
    "bg-blue-500/10 border-b-2 border-blue-500 text-blue-400 cursor-pointer hover:bg-blue-500/20 transition-all px-0.5 rounded-t-sm",
  coherence:
    "bg-amber-500/10 border-b-2 border-amber-500 text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-all px-0.5 rounded-t-sm",
};

type Props = {
  text: string;
  annotations: InlineAnnotation[];
};

export function AnnotatedText({ text, annotations }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Sort by startIndex, filter overlaps, and clamp to text bounds
  const sorted = [...annotations]
    .map((a) => ({
      ...a,
      startIndex: Math.max(0, Math.min(a.startIndex, text.length)),
      endIndex: Math.max(0, Math.min(a.endIndex, text.length)),
    }))
    .filter((a) => a.startIndex < a.endIndex)
    .sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlapping annotations (keep first, skip any that overlap)
  const nonOverlapping: typeof sorted = [];
  for (const ann of sorted) {
    const prev = nonOverlapping[nonOverlapping.length - 1];
    if (!prev || ann.startIndex >= prev.endIndex) {
      nonOverlapping.push(ann);
    }
  }

  const segments: { text: string; annotation?: InlineAnnotation; idx?: number }[] = [];
  let cursor = 0;

  nonOverlapping.forEach((ann, idx) => {
    if (ann.startIndex > cursor) {
      segments.push({ text: text.slice(cursor, ann.startIndex) });
    }
    segments.push({
      text: text.slice(ann.startIndex, ann.endIndex),
      annotation: ann,
      idx,
    });
    cursor = ann.endIndex;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  const activeAnnotation = activeIdx !== null ? nonOverlapping[activeIdx] : null;

  return (
    <div className="relative">
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {segments.map((seg, i) =>
          seg.annotation ? (
            <span
              key={i}
              className={`relative ${TYPE_COLORS[seg.annotation.type] ?? ""}`}
              onClick={() => setActiveIdx(seg.idx === activeIdx ? null : (seg.idx ?? null))}
            >
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </div>

      {/* Tooltip */}
      {activeAnnotation && (
        <div className="mt-3 rounded-lg border-2 border-border bg-surface p-3 shadow-md">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
              {activeAnnotation.type}
            </span>
          </div>
          <p className="text-sm text-ink">
            <span className="font-medium">Suggestion:</span> {activeAnnotation.suggestion}
          </p>
          <p className="mt-1 text-xs text-text-muted">{activeAnnotation.explanation}</p>
        </div>
      )}
    </div>
  );
}
