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
      <div className="flex gap-1 p-1 bg-surface-alt border-2 border-border rounded-2xl mb-5 max-w-lg">
        {SPEAKING_PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActivePart(p.key)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
              activePart === p.key
                ? "bg-accent text-ink font-black shadow-sm"
                : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
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
