"use client";

import { BookOpenCheck, Loader2, Sparkles } from "lucide-react";
import * as m from "motion/react-client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmartReaderResult } from "@/app/(app)/smart-reader/_components/SmartReaderResult";
import type { SmartReaderResponse } from "@/app/(app)/smart-reader/page";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";

const MAX_INPUT_LENGTH = 3000;

function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth <= bp,
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= bp);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [bp]);
  return isMobile;
}

export function FloatingSmartReaderWidget() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const tts = useTextToSpeech();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartReaderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Focus the textarea when the dialog opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const analyze = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    tts.stop?.();
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSourceText(text);

    try {
      const data = await api.post<SmartReaderResponse>("/smart-reader", { text });
      if (ctrl.signal.aborted) return;
      setResult(data);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Analysis failed. Please try again.";
      setError(message);
    } finally {
      if (!ctrl.signal.aborted) setIsLoading(false);
    }
  }, [input, tts]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyze();
    }
  };

  if (pathname?.startsWith("/smart-reader")) return null;

  const bottomOffset = isMobile ? 90 : 24;

  return (
    <>
      {/* ─── Floating button ─── */}
      <div className="fixed flex items-center z-[900]" style={{ bottom: bottomOffset, right: 20 }}>
        <m.button
          onClick={() => setOpen(true)}
          aria-label="Smart Reader — analyze a sentence"
          title="Smart Reader — analyze a sentence"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="w-12 h-12 rounded-2xl cursor-pointer bg-secondary text-text-on-accent flex items-center justify-center border-2 border-secondary shadow-lg hover:shadow-xl transition-shadow duration-200"
        >
          <BookOpenCheck size={20} strokeWidth={2.2} />
        </m.button>
      </div>

      {/* ─── Result modal ─── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 w-[calc(100vw-2rem)] sm:w-[90vw] md:w-[760px] sm:max-w-[760px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Smart Reader</DialogTitle>

          {/* Input zone */}
          <div className="bg-surface border-b-2 border-border shrink-0">
            <div className="flex items-center gap-2 px-4 sm:px-5 pt-3.5">
              <Sparkles size={15} className="text-secondary shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Smart Reader
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Dán câu hoặc đoạn tiếng Anh để phân tích…"
              rows={3}
              maxLength={MAX_INPUT_LENGTH}
              disabled={isLoading}
              className="w-full resize-none border-0 bg-transparent px-4 sm:px-5 py-3 text-sm leading-relaxed text-ink placeholder-text-muted outline-none focus:ring-0 focus:outline-none"
            />
            <div className="flex items-center justify-between px-4 sm:px-5 pb-3">
              <span
                className={`text-[10px] font-mono ${
                  input.length >= MAX_INPUT_LENGTH ? "text-error font-bold" : "text-text-muted"
                }`}
              >
                {input.length} / {MAX_INPUT_LENGTH.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] text-text-muted font-mono">⌘↵</span>
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!input.trim() || isLoading}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    input.trim() && !isLoading
                      ? "bg-secondary text-white shadow-sm hover:brightness-110"
                      : "bg-surface-hover border-2 border-border text-text-muted cursor-not-allowed opacity-50"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Result zone */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
            {error ? (
              <div className="rounded-xl border-2 border-error bg-error/10 p-4 text-sm text-error font-semibold">
                {error}
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-border bg-surface p-5 space-y-3">
                  <div className="h-4 w-32 rounded-lg bg-surface-hover animate-pulse" />
                  <div className="h-4 w-full rounded-lg bg-surface-hover animate-pulse" />
                  <div className="h-4 w-3/4 rounded-lg bg-surface-hover animate-pulse" />
                </div>
                <div className="rounded-xl border-2 border-border bg-surface p-5 space-y-3">
                  <div className="h-4 w-40 rounded-lg bg-surface-hover animate-pulse" />
                  <div className="h-4 w-2/3 rounded-lg bg-surface-hover animate-pulse" />
                </div>
              </div>
            ) : result ? (
              <SmartReaderResult result={result} tts={tts} sourceText={sourceText} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <BookOpenCheck className="h-7 w-7 text-text-muted opacity-40" />
                <p className="text-xs text-text-muted">
                  Dán một câu hoặc đoạn tiếng Anh ở trên rồi bấm{" "}
                  <span className="font-bold text-secondary">Analyze</span>.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
