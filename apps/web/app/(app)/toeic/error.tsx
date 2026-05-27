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
    <div className="flex flex-col items-center justify-center text-center flex-1 min-h-[300px] py-12 px-6">
      <div className="w-14 h-14 rounded-full grid place-items-center mb-4 bg-error-bg border-2 border-border shadow-sm">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-black text-ink font-display">Unable to load page</h3>
      <p className="text-sm text-text-muted max-w-[400px] leading-relaxed mb-5 font-medium">
        An error occurred while loading data. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl border-2 border-border bg-accent text-[var(--text-on-accent)] text-sm font-extrabold cursor-pointer flex items-center gap-2 py-2.5 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-accent-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
      >
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );
}
