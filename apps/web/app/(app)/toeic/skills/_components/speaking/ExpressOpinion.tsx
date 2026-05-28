"use client";

import { Mic } from "lucide-react";
import { useState } from "react";

const OPINION_PROMPTS = [
  {
    id: "op1",
    question: "Do you agree or disagree that companies should allow employees to work from home?",
    topic: "Remote Work",
  },
  {
    id: "op2",
    question:
      "Some people prefer to work for a large company. Others prefer to work for a small company. Which do you prefer and why?",
    topic: "Company Size",
  },
  {
    id: "op3",
    question:
      "Do you think technology has made our lives easier or more complicated? Explain your opinion.",
    topic: "Technology",
  },
  {
    id: "op4",
    question:
      "Is it better to have a job you love with low pay, or a job you dislike with high pay?",
    topic: "Career Choices",
  },
  {
    id: "op5",
    question: "Should companies invest more in training their employees? Why or why not?",
    topic: "Employee Training",
  },
];

export function ExpressOpinion() {
  const [selected, setSelected] = useState<string | null>(null);
  const prompt = OPINION_PROMPTS.find((p) => p.id === selected);

  return (
    <div className="px-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center mx-auto mb-2.5">
          <Mic className="h-5 w-5" />
        </div>
        <h3 className="m-0 mb-1 text-base font-bold text-ink">Express an Opinion · Part 5</h3>
        <p className="m-0 text-xs text-text-muted font-bold max-w-sm mx-auto leading-relaxed">
          Present your opinion on a topic. You have 30 seconds to prepare and 60 seconds to speak.
        </p>
      </div>

      {!prompt ? (
        <div className="flex flex-col gap-2.5">
          {OPINION_PROMPTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className="p-4.5 rounded-2xl border-2 border-border bg-surface text-left w-full cursor-pointer transition-all duration-150 hover:border-accent/40 active:scale-99 block"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-xs font-bold text-info mb-1">{p.topic}</div>
              <div className="text-sm text-ink leading-relaxed font-semibold">{p.question}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <div className="p-7 rounded-2xl border-2 border-info/20 bg-info/5 w-full max-w-xl text-center">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-info mb-3">
              {prompt.topic}
            </div>
            <p className="text-base md:text-lg leading-relaxed text-ink m-0 font-semibold">
              {prompt.question}
            </p>
          </div>
          <div className="p-3 px-4.5 rounded-xl bg-surface-alt border-2 border-border text-xs text-text-secondary leading-relaxed max-w-md text-center shadow-sm">
            💡 <strong className="text-text-primary">Suggested Structure:</strong> State opinion →
            Give reason 1 + example → Reason 2 → Conclusion
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="px-6 py-2.5 rounded-xl border-2 border-border bg-surface text-text-secondary hover:text-ink hover:bg-surface-hover hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold cursor-pointer"
          >
            ← Choose another topic
          </button>
        </div>
      )}
    </div>
  );
}
