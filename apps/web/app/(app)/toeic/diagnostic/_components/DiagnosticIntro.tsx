"use client";

import { Button, Card } from "antd";

export function DiagnosticIntro({ onStart }: { onStart: () => void }) {
  return (
    <Card title="TOEIC Diagnostic Test">
      <p>
        You will complete <strong>30 questions in 20 minutes</strong> to determine your starting proficiency in each sub-skill. The results will shape your study path and daily recommendations.
      </p>
      <ul>
        <li>Covers Part 3–7 (Part 1 & 2 will be added in a future update)</li>
        <li>No explanations shown until submission</li>
        <li>Results will be saved to your profile (initial mastery levels)</li>
      </ul>
      <Button type="primary" size="large" onClick={onStart}>
        Start
      </Button>
    </Card>
  );
}
