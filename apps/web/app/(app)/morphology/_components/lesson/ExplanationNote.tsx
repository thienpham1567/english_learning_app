"use client";

import { Lightbulb } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";

interface ExplanationNoteProps {
  explanationVi: string;
  explanationEn: string;
}

/** Post-answer rationale with a VI/EN toggle. */
export function ExplanationNote({ explanationVi, explanationEn }: ExplanationNoteProps) {
  const [lang, setLang] = useState<"vi" | "en">("vi");

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-alt border border-accent/15 p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-active uppercase tracking-wider">
          <Lightbulb size={13} /> Explanation
        </span>
        <div className="flex overflow-hidden rounded-md border border-border">
          {(["vi", "en"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setLang(opt)}
              className={`text-[10.5px] font-bold py-1 px-2.5 cursor-pointer transition-colors ${
                lang === opt
                  ? "bg-accent text-text-on-accent"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {opt === "vi" ? "VIE" : "ENG"}
            </button>
          ))}
        </div>
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary font-medium">
        {lang === "en" ? explanationEn : explanationVi}
      </p>
    </m.div>
  );
}
