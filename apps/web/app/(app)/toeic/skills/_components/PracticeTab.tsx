"use client";

import { PracticeRunner } from "@/app/(app)/toeic/practice/_components/PracticeRunner";

/**
 * Embedded ETS Practice inside the unified TOEIC Skills page.
 * Wraps the existing PracticeRunner component.
 */
export function PracticeTab() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <PracticeRunner />
    </div>
  );
}
