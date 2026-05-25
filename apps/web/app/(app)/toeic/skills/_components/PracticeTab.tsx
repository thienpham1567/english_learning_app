"use client";

import { PracticeRunner } from "@/app/(app)/toeic/practice/_components/PracticeRunner";

/**
 * Embedded ETS Practice inside the unified TOEIC Skills page.
 * Wraps the existing PracticeRunner component.
 */
export function PracticeTab() {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <PracticeRunner />
    </div>
  );
}
