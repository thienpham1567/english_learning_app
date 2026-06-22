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
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="w-12 h-12 rounded-2xl cursor-pointer bg-secondary text-white flex items-center justify-center border border-border shadow hover:shadow-lg transition-shadow duration-200"
        >
          <BookOpenCheck size={20} strokeWidth={2.2} />
        </m.button>
      </div>

      {/* ─── Result modal ─── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 w-[calc(100vw-2rem)] sm:w-[90vw] md:w-[760px] sm:max-w-[760px] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl shadow-xl">
          <DialogTitle className="sr-only">Smart Reader</DialogTitle>

          {/* Input zone */}
          <div className="bg-surface border-b border-border shrink-0">
            <div className="flex items-center gap-2 px-4 sm:px-5 pt-3.5">
              <span className="text-secondary text-sm leading-none">◆</span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink font-mono">
                Smart Reader
              </span>
              <span className="text-text-muted/50">·</span>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                Phân tích câu
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
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline text-[10px] text-text-muted font-mono font-bold">
                  ⌘↵
                </span>
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!input.trim() || isLoading}
                  className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    input.trim() && !isLoading
                      ? "border-border bg-secondary text-white shadow-sm hover:shadow-md active:scale-[0.98]"
                      : "border-border bg-surface-hover text-text-muted cursor-not-allowed opacity-50"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang phân tích…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Phân tích
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Result zone */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
            {error ? (
              <div className="flex items-start gap-2.5 border border-error/30 bg-error/10 p-4 rounded-xl text-sm text-error font-semibold shadow-sm">
                <span className="font-mono">⚠</span>
                {error}
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="border border-border bg-surface p-5 space-y-3 shadow-sm rounded-xl">
                  <div className="h-3.5 w-32 bg-bg-deep animate-pulse" />
                  <div className="h-4 w-full bg-bg-deep animate-pulse" />
                  <div className="h-4 w-3/4 bg-bg-deep animate-pulse" />
                </div>
                <div className="border border-border bg-surface p-5 space-y-3 shadow-sm rounded-xl">
                  <div className="h-3.5 w-40 bg-bg-deep animate-pulse" />
                  <div className="h-4 w-2/3 bg-bg-deep animate-pulse" />
                </div>
              </div>
            ) : result ? (
              <SmartReaderResult result={result} tts={tts} sourceText={sourceText} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                <div className="grid h-14 w-14 place-items-center border border-border bg-bg-deep text-secondary shadow-sm rounded-xl">
                  <BookOpenCheck className="h-6 w-6" />
                </div>
                <p className="max-w-[320px] text-xs font-medium leading-relaxed text-text-muted">
                  Dán một câu hoặc đoạn tiếng Anh ở trên rồi bấm{" "}
                  <span className="font-semibold uppercase tracking-wide text-secondary">
                    Phân tích
                  </span>
                  .
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
