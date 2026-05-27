"use client";

import { PersonalizedDrill } from "./PersonalizedDrill";
import { WritingPatternSection } from "./WritingPatternSection";

export function AnalysisTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Personalized Drill */}
      <PersonalizedDrill />

      {/* Writing Patterns */}
      <WritingPatternSection />
    </div>
  );
}
