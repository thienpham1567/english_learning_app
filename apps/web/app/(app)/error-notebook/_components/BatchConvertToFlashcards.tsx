"use client";

import { ArrowRight, Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

interface BatchConvertProps {
  errorIds: string[];
}

type ConvertState = "idle" | "loading" | "done";

/**
 * "Convert All Errors to Flashcards" button.
 * Sends unresolved error IDs to the batch flashcard generation endpoint.
 * Falls back to sequential conversion if batch endpoint doesn't exist.
 */
export function BatchConvertToFlashcards({ errorIds }: BatchConvertProps) {
  const [state, setState] = useState<ConvertState>("idle");
  const [converted, setConverted] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async () => {
    if (errorIds.length === 0) return;
    setState("loading");
    setError(null);
    setConverted(0);

    try {
      // Try batch endpoint first
      const result = await api.post<{ converted: number }>("/errors/batch-to-flashcard", {
        errorIds,
      });
      setConverted(result.converted);
      setState("done");
    } catch {
      // Fallback: sequential conversion
      let count = 0;
      for (const id of errorIds.slice(0, 20)) {
        // Cap at 20 to avoid overload
        try {
          await api.post(`/errors/${id}/to-flashcard`, {});
          count++;
          setConverted(count);
        } catch {
          // Skip failed individual conversions
        }
      }
      if (count > 0) {
        setState("done");
      } else {
        setError("Failed to convert errors. Please try again later.");
        setState("idle");
      }
    }
  }, [errorIds]);

  if (errorIds.length === 0) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card shadowSize="default" accentColor="accent" accentPosition="left" bgType="accent-light">
        {state === "idle" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 grid place-items-center shrink-0">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink font-display">
                  Convert Errors to Flashcards
                </div>
                <div className="text-[11px] text-text-muted font-medium mt-0.5">
                  Turn {errorIds.length} unresolved errors into spaced-repetition flashcards
                </div>
              </div>
            </div>
            <m.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConvert}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent bg-accent text-text-on-accent text-xs font-extrabold cursor-pointer shadow-sm shrink-0"
            >
              <CreditCard size={14} />
              Convert All ({errorIds.length})
            </m.button>
          </div>
        )}

        {state === "loading" && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 size={18} className="animate-spin text-accent" />
            <div>
              <div className="text-sm font-bold text-ink">Converting errors to flashcards...</div>
              <div className="text-[11px] text-text-muted font-medium mt-0.5">
                {converted}/{errorIds.length} converted
              </div>
            </div>
          </div>
        )}

        {state === "done" && (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 grid place-items-center shrink-0">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-success font-display">
                {converted} flashcards created!
              </div>
              <div className="text-[11px] text-text-muted font-medium mt-0.5">
                They'll appear in your next flashcard session
              </div>
            </div>
            <a
              href="/flashcards"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-accent bg-accent/10 text-accent text-xs font-extrabold no-underline hover:bg-accent/20 transition-colors"
            >
              Go to Flashcards <ArrowRight size={12} />
            </a>
          </div>
        )}

        {error && <p className="text-xs text-error font-semibold mt-2">{error}</p>}
      </Card>
    </m.div>
  );
}
