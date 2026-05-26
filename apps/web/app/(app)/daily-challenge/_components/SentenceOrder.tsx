"use client";

import { useState } from "react";
import type { SentenceOrderData } from "@/lib/daily-challenge/types";

import * as m from "motion/react-client";
import { Check, X } from "lucide-react";

type Props = {
  data: SentenceOrderData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SentenceOrder({ data, instruction, onAnswer, disabled }: Props) {
  const [available, setAvailable] = useState([...data.scrambled]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredSel, setHoveredSel] = useState<number | null>(null);

  const addWord = (word: string, idx: number) => {
    if (disabled) return;
    setSelected((prev) => [...prev, word]);
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    if (disabled) return;
    const word = selected[idx];
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    setAvailable((prev) => [...prev, word]);
  };

  const handleSubmit = () => {
    onAnswer(selected.join(" "));
  };

  const allSelected = selected.length === data.scrambled.length;

  return (
    <div>
      {/* Instruction */}
      <p className="text-[11px] font-extrabold text-accent uppercase tracking-widest" style={{marginBottom: 14}} >
        🔀 {instruction}
      </p>

      {/* Drop zone — sentence being built */}
      <div className="mb-5 flex flex-wrap h-[64px] gap-2 rounded-(--radius-lg) items-start" style={{border: allSelected
            ? "2px solid var(--accent)"
            : "2px dashed var(--border)", background: allSelected
            ? "var(--accent-light)"
            : "var(--surface-alt)", padding: "12px 14px", alignContent: "flex-start", transition: "all 0.2s ease", boxShadow: allSelected ? "0 4px 12px var(--accent-muted)" : "inset 0 1px 3px rgba(0,0,0,0.03)"}} >
        {selected.length === 0 ? (
          <span className="text-[13px] text-text-muted italic" style={{padding: "6px 2px"}} >
            Nhấn vào các từ bên dưới để ghép thành câu hoàn chỉnh...
          </span>
        ) : (
          selected.map((w, i) => (
            <m.button
              key={`s-${i}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => removeWord(i)}
              onMouseEnter={() => setHoveredSel(i)}
              onMouseLeave={() => setHoveredSel(null)}
              disabled={disabled} className="rounded-lg py-1.5 px-3.5 text-sm font-semibold items-center" style={{background: hoveredSel === i && !disabled
                    ? "rgba(239, 68, 68, 0.1)"
                    : "var(--surface)", color: hoveredSel === i && !disabled ? "var(--error)" : "var(--accent)", border: hoveredSel === i && !disabled
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid var(--border)", cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease", boxShadow: "var(--shadow-sm)", display: "inline-flex", gap: 5}} >
              {w}
              {!disabled && (
                <X
                  style={{
                    fontSize: 8,
                    color: hoveredSel === i ? "var(--error)" : "var(--text-muted)",
                    marginLeft: 2,
                  }}
                />
              )}
            </m.button>
          ))
        )}
      </div>

      {/* Available word bank */}
      <div className="rounded-(--radius-lg) border border-(--border) bg-(--surface) mb-5" style={{padding: "16px 18px", boxShadow: "var(--shadow-sm)"}} >
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-3" >
          Ngân hàng từ vựng
        </div>
        <div className="flex flex-wrap gap-2" >
          {available.length === 0 ? (
            <span className="text-[13px] text-text-muted italic" >
              Đã sử dụng hết tất cả từ trong ngân hàng từ!
            </span>
          ) : (
            available.map((w, i) => (
              <m.button
                key={`a-${i}`}
                whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
                whileTap={!disabled ? { scale: 0.96 } : {}}
                onClick={() => addWord(w, i)}
                disabled={disabled} className="rounded-lg bg-surface-alt py-1.5 px-3.5 text-sm font-semibold text-text-primary" style={{border: "1.5px solid var(--border)", cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease", boxShadow: "var(--shadow-sm)"}} >
                {w}
              </m.button>
            ))
          )}
        </div>
      </div>

      {/* Confirm button */}
      {allSelected && !disabled && (
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit} className="w-full rounded-(--radius-lg) text-[15px] font-extrabold border-none cursor-pointer" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", padding: "14px 0", color: "var(--text-on-accent)", boxShadow: "0 6px 18px var(--accent-muted)"}} >
          <Check size={12} /> Xác nhận đáp án
        </m.button>
      )}
    </div>
  );
}
