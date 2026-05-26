"use client";

import { useState } from "react";
import type { ReadingComprehensionData } from "@/lib/daily-challenge/types";

import * as m from "motion/react-client";
import { BookOpenText } from "lucide-react";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: ReadingComprehensionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ReadingComprehension({ data, instruction, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  return (
    <div>
      {/* Instruction */}
      <p className="text-[11px] font-extrabold text-accent uppercase tracking-widest" style={{marginBottom: 14}} >
        📖 {instruction}
      </p>

      {/* Passage */}
      <div className="mb-5 rounded-(--radius-xl) bg-surface-alt" style={{borderLeft: "4px solid var(--accent)", padding: "18px 20px", boxShadow: "var(--shadow-sm)"}} >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5 mb-2.5" >
          <BookOpenText size={11} /> Văn bản đọc hiểu
        </span>
        <p className="m-0 text-text-primary font-medium font-body" style={{fontSize: 14.5, lineHeight: 1.8}} >
          {data.passage}
        </p>
      </div>

      {/* Question */}
      <div className="mb-4 py-3 px-4 rounded-(--radius-lg) bg-surface-alt border border-(--border)" >
        <p className="m-0 text-[15px] font-bold text-text-primary leading-relaxed" >
          {data.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5" >
        {data.options.map((opt, i) => {
          const isSelected = selected === i;

          return (
            <m.button
              key={i}
              whileHover={!disabled ? { scale: 1.01, x: 2 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(i)}
              disabled={disabled} className="flex items-center gap-3 rounded-(--radius-lg) py-3 px-4 text-left text-sm leading-normal" style={{border: isSelected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)", background: isSelected
                  ? "var(--accent-light)"
                  : "var(--surface)", fontWeight: isSelected ? 700 : 600, color: isSelected ? "var(--accent)" : "var(--text-primary)", cursor: disabled ? "default" : "pointer", transition: "border-color 0.2s, background-color 0.2s", boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)"}} >
              <span className="w-[26px] h-[26px] rounded-full grid shrink-0 text-[11px] font-extrabold" style={{placeItems: "center", background: isSelected ? "var(--accent)" : "var(--border)", color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)", transition: "all 0.15s"}} >
                {LABELS[i]}
              </span>
              <span className="flex-1" >{opt}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
