"use client";

import { Card } from "@/components/ui/card";

export function DiagnosticIntro({ onStart }: { onStart: () => void }) {
  return (
    <Card shadowSize="sm" className="p-4">
      <p>
        You will complete <strong>30 questions in 20 minutes</strong> to determine your starting
        proficiency in each sub-skill. The results will shape your study path and daily
        recommendations.
      </p>
      <ul>
        <li>Covers Part 3–7 (Part 1 & 2 will be added in a future update)</li>
        <li>No explanations shown until submission</li>
        <li>Results will be saved to your profile (initial mastery levels)</li>
      </ul>
      <button
        className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm"
        onClick={onStart}
      >
        Start
      </button>
    </Card>
  );
}
