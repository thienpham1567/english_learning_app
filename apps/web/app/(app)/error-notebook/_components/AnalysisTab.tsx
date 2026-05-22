"use client";

import { PersonalizedDrill } from "./PersonalizedDrill";
import { WritingPatternSection } from "./WritingPatternSection";

export function AnalysisTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Personalized Drill */}
      <PersonalizedDrill />

      {/* Writing Patterns */}
      <WritingPatternSection />
    </div>
  );
}
