"use client";

import { useState } from "react";
import { ReadAloud } from "./speaking/ReadAloud";
import { ExpressOpinion } from "./speaking/ExpressOpinion";
import { DescribePicture } from "./speaking/DescribePicture";

type SpeakingPart = "part3" | "part1" | "part5";

const SPEAKING_PARTS: { key: SpeakingPart; label: string; desc: string }[] = [
  { key: "part3", label: "Part 3 · Mô tả hình", desc: "Describe a Picture" },
  { key: "part1", label: "Part 1 · Đọc to", desc: "Read Aloud" },
  { key: "part5", label: "Part 5 · Ý kiến", desc: "Express an Opinion" },
];

export function SpeakingTab() {
  const [activePart, setActivePart] = useState<SpeakingPart>("part3");

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Part selector */}
      <div className="flex gap-2 py-2 pb-3.5 flex-wrap">
        {SPEAKING_PARTS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActivePart(p.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
              activePart === p.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-slate-400 hover:border-slate-800 hover:text-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePart === "part1" && <ReadAloud />}
      {activePart === "part5" && <ExpressOpinion />}
      {activePart === "part3" && <DescribePicture />}
    </div>
  );
}
