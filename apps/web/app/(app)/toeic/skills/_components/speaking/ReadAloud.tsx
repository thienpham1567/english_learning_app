"use client";

import { Volume2 } from "lucide-react";
import { useState } from "react";

const READ_ALOUD_PASSAGES = [
  {
    id: "ra1",
    text: "The quarterly financial report indicates that revenue has increased by twelve percent compared to the same period last year, primarily driven by strong performance in the Asia-Pacific region.",
    topic: "Business Report",
  },
  {
    id: "ra2",
    text: "All employees are required to complete the mandatory safety training program by the end of this month. Please register through the company intranet portal.",
    topic: "Office Announcement",
  },
  {
    id: "ra3",
    text: "Thank you for calling GreenTech Solutions. Our office hours are Monday through Friday, nine a.m. to six p.m. For technical support, please press one.",
    topic: "Phone Message",
  },
  {
    id: "ra4",
    text: "The conference room on the third floor has been reserved for the marketing team's presentation on Thursday. Light refreshments will be provided during the break.",
    topic: "Meeting Notice",
  },
  {
    id: "ra5",
    text: "Due to scheduled maintenance, the building's elevator service will be temporarily suspended this Saturday from eight a.m. to two p.m. We apologize for any inconvenience.",
    topic: "Building Notice",
  },
  {
    id: "ra6",
    text: "The new employee orientation session will cover company policies, benefits information, and an overview of departmental responsibilities. Please bring a valid photo identification.",
    topic: "HR Notice",
  },
];

export function ReadAloud() {
  const [selected, setSelected] = useState<string | null>(null);
  const passage = READ_ALOUD_PASSAGES.find((p) => p.id === selected);

  return (
    <div className="px-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-2.5">
          <Volume2 className="h-5 w-5" />
        </div>
        <h3 className="m-0 mb-1 text-base font-bold text-ink">Read Aloud · Part 1</h3>
        <p className="m-0 text-xs text-text-muted font-bold max-w-sm mx-auto leading-relaxed">
          Read the displayed passage aloud. You have 45 seconds to prepare and 45 seconds to read.
        </p>
      </div>

      {!passage ? (
        <div className="flex flex-col gap-2.5">
          {READ_ALOUD_PASSAGES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className="p-4.5 rounded-2xl border-2 border-border bg-surface text-left w-full cursor-pointer transition-all duration-150 hover:border-accent/40 active:scale-99 block"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-sm font-bold text-ink">{p.topic}</div>
              <div className="text-xs text-text-muted font-bold mt-1 leading-relaxed">
                {p.text.slice(0, 80)}...
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <div className="p-6 rounded-2xl border-2 border-border bg-surface w-full max-w-xl">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent mb-2.5">
              {passage.topic}
            </div>
            <p className="text-base md:text-lg leading-relaxed text-ink m-0 font-body">
              {passage.text}
            </p>
          </div>
          <p className="text-xs text-text-muted font-bold text-center leading-relaxed">
            Read the passage above aloud. Pay attention to clear pronunciation and natural
            intonation.
          </p>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="px-6 py-2.5 rounded-xl border-2 border-border bg-surface text-text-secondary hover:text-ink hover:bg-surface-hover hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold cursor-pointer"
          >
            ← Choose another passage
          </button>
        </div>
      )}
    </div>
  );
}
