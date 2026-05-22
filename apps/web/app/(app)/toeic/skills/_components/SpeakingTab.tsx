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
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
      {/* Part selector */}
      <div style={{ display: "flex", gap: 8, padding: "8px 14px", flexWrap: "wrap", marginBottom: 8 }}>
        {SPEAKING_PARTS.map(p => (
          <button key={p.key} type="button" onClick={() => setActivePart(p.key)}
            style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${activePart === p.key ? "var(--accent)" : "var(--border)"}`,
              background: activePart === p.key ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
              color: activePart === p.key ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
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
