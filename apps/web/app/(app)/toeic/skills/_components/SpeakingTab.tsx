"use client";

import { useState } from "react";
import { DescribePicture } from "./speaking/DescribePicture";
import { ExpressOpinion } from "./speaking/ExpressOpinion";
import { ReadAloud } from "./speaking/ReadAloud";

type SpeakingPart = "part3" | "part1" | "part5";

const SPEAKING_PARTS: { key: SpeakingPart; label: string; desc: string }[] = [
  { key: "part3", label: "Part 3 · Describe a Picture", desc: "Describe a Picture" },
  { key: "part1", label: "Part 1 · Read Aloud", desc: "Read Aloud" },
  { key: "part5", label: "Part 5 · Express an Opinion", desc: "Express an Opinion" },
];

export function SpeakingTab() {
  const [activePart, setActivePart] = useState<SpeakingPart>("part3");

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Part selector */}
      <div className="flex gap-2 py-2 pb-3.5 flex-wrap">
        {SPEAKING_PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActivePart(p.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
              activePart === p.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-ink hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm transition-all duration-100"
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
