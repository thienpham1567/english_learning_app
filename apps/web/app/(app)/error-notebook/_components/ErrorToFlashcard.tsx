"use client";

import {
  ArrowRight,
  Check,
  CreditCard,
  Lightbulb,
  Loader2,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";

type FlashcardData = {
  front: string;
  back: string;
  example: string;
  exampleVi: string;
  tip: string;
  type: string;
  sourceErrorId: string;
};

interface ErrorToFlashcardProps {
  errorId: string;
}

export function ErrorToFlashcard({ errorId }: ErrorToFlashcardProps) {
  const [state, setState] = useState<"idle" | "loading" | "preview" | "saved">("idle");
  const [card, setCard] = useState<FlashcardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { speak, isSpeaking } = useTextToSpeech();

  const generate = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await api.post<FlashcardData>(`/errors/${errorId}/to-flashcard`, {});
      setCard(data);
      setState("preview");
    } catch {
      setError("Failed to generate flashcard. Please try again.");
      setState("idle");
    }
  }, [errorId]);

  const saveToSession = useCallback(() => {
    // Save flashcard to localStorage for the next AI flashcard session
    if (!card) return;
    try {
      const stored = localStorage.getItem("error-flashcards") ?? "[]";
      const existing: FlashcardData[] = JSON.parse(stored);
      // Avoid duplicates
      if (!existing.some((c) => c.sourceErrorId === card.sourceErrorId)) {
        existing.push(card);
        localStorage.setItem("error-flashcards", JSON.stringify(existing));
      }
    } catch {
      // Ignore
    }
    setState("saved");
  }, [card]);

  return (
    <div>
      {/* Generate Button */}
      {state === "idle" && (
        <m.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-accent/30 bg-accent/5 text-accent text-xs font-extrabold cursor-pointer transition-colors hover:bg-accent/10"
        >
          <CreditCard size={14} />
          Create Flashcard from This Error
        </m.button>
      )}

      {error && <p className="text-xs text-error font-semibold mt-2">{error}</p>}

      {/* Loading */}
      {state === "loading" && (
        <div className="flex items-center justify-center gap-2 py-4 text-accent text-xs font-bold">
          <Loader2 size={16} className="animate-spin" />
          <span>AI is creating your flashcard...</span>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {state === "preview" && card && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 rounded-xl border border-accent/20 bg-surface overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 py-2.5 border-b-2 border-border bg-accent/5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} />
                Generated Flashcard
              </span>
              <button
                onClick={() => setState("idle")}
                className="w-6 h-6 grid place-items-center rounded-md bg-transparent border-none text-text-muted cursor-pointer hover:bg-surface-alt text-xs"
              >
                <X size={12} />
              </button>
            </div>

            {/* Card Content */}
            <div className="p-4 flex flex-col gap-3">
              {/* Front */}
              <div>
                <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest">
                  Front
                </span>
                <div className="text-sm font-bold text-ink mt-1 leading-relaxed flex items-start gap-2">
                  <span className="flex-1">{card.front}</span>
                  <button
                    onClick={() => speak(card.front)}
                    disabled={isSpeaking}
                    className="shrink-0 w-6 h-6 grid place-items-center rounded-md bg-surface-alt border border-border text-accent cursor-pointer text-xs"
                  >
                    <Volume2 size={11} />
                  </button>
                </div>
              </div>

              {/* Back */}
              <div>
                <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest">
                  Back
                </span>
                <p className="text-[13px] text-text-secondary font-medium mt-1 leading-relaxed m-0">
                  {card.back}
                </p>
              </div>

              {/* Example */}
              <div className="px-3 py-2.5 rounded-lg bg-surface-alt border border-border">
                <span className="text-[9px] font-extrabold text-accent uppercase tracking-widest">
                  Example
                </span>
                <p className="text-[13px] text-ink font-semibold mt-1 m-0 leading-relaxed">
                  {card.example}
                </p>
                <p className="text-[11px] text-text-muted font-medium mt-1 m-0">{card.exampleVi}</p>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-xp/5 border border-warning/15">
                <Lightbulb size={13} className="text-xp shrink-0 mt-0.5" />
                <p className="text-[12px] text-text-secondary font-medium m-0 leading-relaxed">
                  {card.tip}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t-2 border-border flex gap-2">
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={generate}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-border bg-surface text-text-secondary text-xs font-bold cursor-pointer transition-colors hover:bg-surface-alt"
              >
                <Sparkles size={12} />
                Regenerate
              </m.button>
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveToSession}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border-none bg-primary text-primary-foreground text-xs font-extrabold cursor-pointer shadow-sm"
              >
                <Check size={12} />
                Save to Deck
              </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Saved confirmation */}
      {state === "saved" && (
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl border border-success/30 bg-success/8 text-xs font-bold text-success"
        >
          <Check size={14} />
          <span className="flex-1">
            Flashcard saved! It will appear in your next flashcard session.
          </span>
          <a
            href="/flashcards"
            className="no-underline text-accent font-extrabold flex items-center gap-1 hover:underline"
          >
            Go <ArrowRight size={12} />
          </a>
        </m.div>
      )}
    </div>
  );
}
