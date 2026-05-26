"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

const OPINION_PROMPTS = [
  { id: "op1", question: "Do you agree or disagree that companies should allow employees to work from home?", topic: "Remote Work" },
  { id: "op2", question: "Some people prefer to work for a large company. Others prefer to work for a small company. Which do you prefer and why?", topic: "Company Size" },
  { id: "op3", question: "Do you think technology has made our lives easier or more complicated? Explain your opinion.", topic: "Technology" },
  { id: "op4", question: "Is it better to have a job you love with low pay, or a job you dislike with high pay?", topic: "Career Choices" },
  { id: "op5", question: "Should companies invest more in training their employees? Why or why not?", topic: "Employee Training" },
];

export function ExpressOpinion() {
  const [selected, setSelected] = useState<string | null>(null);
  const prompt = OPINION_PROMPTS.find(p => p.id === selected);

  return (
    <div className="px-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-(--info)/10 text-(--info) flex items-center justify-center mx-auto mb-2.5">
          <Mic className="h-5 w-5" />
        </div>
        <h3 className="m-0 mb-1 text-base font-bold text-ink">Express an Opinion · Part 5</h3>
        <p className="m-0 text-xs text-slate-455 max-w-sm mx-auto leading-relaxed">
          Trình bày ý kiến của bạn về một chủ đề. Bạn có 30 giây chuẩn bị và 60 giây để nói.
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
              <div className="text-xs font-bold text-(--info) mb-1">{p.topic}</div>
              <div className="text-sm text-ink leading-relaxed font-semibold">{p.question}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <div className="p-7 rounded-2xl border-2 border-(--info)/20 bg-(--info)/5 w-full max-w-xl text-center">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-(--info) mb-3">
              {prompt.topic}
            </div>
            <p className="text-base md:text-lg leading-relaxed text-ink m-0 font-semibold">
              {prompt.question}
            </p>
          </div>
          <div className="p-3 px-4.5 rounded-xl bg-slate-900/40 border border-slate-850/60 text-xs text-slate-350 leading-relaxed max-w-md text-center">
            💡 <strong className="text-slate-200">Gợi ý cấu trúc:</strong> Nêu quan điểm → Đưa lý do 1 + ví dụ → Lý do 2 → Kết luận
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="px-6 py-2.5 rounded-xl border-2 border-border bg-transparent text-slate-350 hover:text-slate-200 hover:border-slate-800 transition-colors text-xs font-bold cursor-pointer"
          >
            ← Chọn chủ đề khác
          </button>
        </div>
      )}
    </div>
  );
}
