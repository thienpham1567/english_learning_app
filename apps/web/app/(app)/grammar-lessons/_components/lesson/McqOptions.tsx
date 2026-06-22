"use client";

import { CircleCheckBig, XCircle } from "lucide-react";
import * as m from "motion/react-client";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

interface McqOptionsProps {
  options: readonly string[];
  answer: string;
  selected: string | null;
  revealed: boolean;
  onSelect: (option: string) => void;
}

/** Multiple-choice answer list with correct/incorrect reveal states. */
export function McqOptions({ options, answer, selected, revealed, onSelect }: McqOptionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, idx) => {
        const isCorrect = opt === answer;
        const isSelected = opt === selected;

        // Resolve visual state.
        let container = "border-border bg-surface text-text-primary hover:border-border-strong";
        let badge = "bg-surface-alt text-text-secondary border-border";
        if (revealed && isCorrect) {
          container = "border-success bg-success/10 text-success font-bold";
          badge = "bg-success text-success-foreground border-success";
        } else if (revealed && isSelected && !isCorrect) {
          container = "border-error bg-error/10 text-error font-bold";
          badge = "bg-error text-error-foreground border-error";
        } else if (revealed) {
          container = "border-border bg-surface text-text-muted opacity-50";
        } else if (isSelected) {
          container = "border-accent bg-accent-light text-accent-active font-bold";
          badge = "bg-accent text-text-on-accent border-accent";
        }

        return (
          <m.button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            disabled={revealed}
            whileHover={revealed ? undefined : { x: 2 }}
            whileTap={revealed ? undefined : { scale: 0.995 }}
            className={`flex w-full items-center gap-3 py-3 px-3.5 rounded-xl text-left text-sm border transition-colors duration-150 ${
              revealed ? "cursor-default" : "cursor-pointer"
            } ${container}`}
          >
            <span
              className={`grid place-items-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 border ${badge}`}
            >
              {revealed && isCorrect ? (
                <CircleCheckBig size={15} />
              ) : revealed && isSelected && !isCorrect ? (
                <XCircle size={15} />
              ) : (
                OPTION_LABELS[idx]
              )}
            </span>
            <span className="flex-1">{opt}</span>
          </m.button>
        );
      })}
    </div>
  );
}
