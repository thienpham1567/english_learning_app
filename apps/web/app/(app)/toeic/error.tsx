"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ToeicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ToeicError]", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center flex-1 h-[300px]"
      style={{ padding: "48px 24px" }}
    >
      <div
        className="w-[56px] h-[56px] rounded-full grid mb-4"
        style={{ background: "var(--error-bg)", placeItems: "center" }}
      >
        <AlertTriangle className="text-3xl text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-ink font-display">Unable to load page</h3>
      <p
        className="text-[13px] text-text-muted w-[400px] leading-relaxed"
        style={{ margin: "0 0 20px" }}
      >
        An error occurred while loading data. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl border-none text-sm font-semibold cursor-pointer flex items-center gap-2"
        style={{
          padding: "10px 24px",
          background: "var(--accent)",
          color: "var(--text-on-accent)",
        }}
      >
        <RefreshCw /> Retry
      </button>
    </div>
  );
}
