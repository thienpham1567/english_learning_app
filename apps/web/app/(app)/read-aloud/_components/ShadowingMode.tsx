"use client";

import { toast } from "sonner";
import {
  ChevronRight,
  CircleCheckBig,
  Loader2,
  Mic,
  PlayCircle,
  Redo,
  StopCircle,
  Volume2,
  BookOpen,
  Award,
  Sparkles,
  Lightbulb,
  Headphones
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useCallback, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { splitIntoSentences } from "../_hooks/useSentences";
import { type EvalResult, ShadowResult } from "./ShadowResult";


type ShadowStep = "idle" | "listening" | "ready-to-record" | "recording" | "evaluating" | "result";

interface ShadowingModeProps {
  text: string;
  voiceRole: string;
  speed: number;
}

export function ShadowingMode({ text, voiceRole, speed }: ShadowingModeProps) {
  const sentences = splitIntoSentences(text);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState<ShadowStep>("idle");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [sentenceResults, setSentenceResults] = useState<(EvalResult | null)[]>(
    new Array(sentences.length).fill(null),
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voice = useVoiceInput({ autoTranscribe: false });

  const currentSentence = sentences[currentIdx] ?? "";
  const progress =
    sentences.length > 0
      ? Math.round((sentenceResults.filter(Boolean).length / sentences.length) * 100)
      : 0;

  /* ── Play reference audio ── */
  const playReference = useCallback(async () => {
    setStep("listening");
    setEvalResult(null);

    try {
      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentSentence.trim(), voice: voiceRole, speed }),
      });

      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setStep("ready-to-record");
      };
      audio.onerror = () => {
        toast.error("Audio playback error");
        setStep("idle");
      };
      await audio.play();
    } catch {
      toast.error("Unable to play model sentence");
      setStep("idle");
    }
  }, [currentSentence, voiceRole, speed]);

  /* ── Start recording ── */
  const startRecording = useCallback(async () => {
    setStep("recording");
    await voice.start();
  }, [voice]);

  /* ── Stop recording & evaluate ── */
  const stopAndEvaluate = useCallback(async () => {
    voice.stop();
    setStep("evaluating");

    // Wait a tick for blob to be ready
    await new Promise((r) => setTimeout(r, 300));

    const audioBlob = voice.blob;
    if (!audioBlob) {
      toast.error("No audio recording found");
      setStep("ready-to-record");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "shadowing.webm");
      formData.append("referenceText", currentSentence.trim());
      formData.append("durationMs", String(Math.round(voice.durationMs)));

      const res = await fetch("/api/read-aloud/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        if (err.error === "no-speech") {
          toast.warning("Speech not recognized. Please speak clearly and try again.");
          setStep("ready-to-record");
          return;
        }
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result: EvalResult = await res.json();
      setEvalResult(result);
      setSentenceResults((prev) => {
        const next = [...prev];
        next[currentIdx] = result;
        return next;
      });
      setStep("result");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI grading failed");
      setStep("ready-to-record");
    }
  }, [voice, currentSentence, currentIdx]);

  /* ── Navigation ── */
  const goToNext = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setStep("idle");
      setEvalResult(null);
    }
  }, [currentIdx, sentences.length]);

  const retry = useCallback(() => {
    setStep("idle");
    setEvalResult(null);
  }, []);

  if (sentences.length === 0) {
    return (
      <div className="bg-(--surface) rounded-(--radius-xl) border-2 border-border text-center"
        style={{ padding: "40px 24px" }}
      >
        <div className="flex justify-center mb-4"><Mic size={48} className="text-accent" /></div>
        <h3 className="mb-2 text-text-primary">
          Shadowing Mode
        </h3>
        <span className="text-text-muted block w-[400px] mx-auto">
          Please enter or select a passage in the "Listen" tab first, then return here to practice shadowing.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="bg-(--surface) rounded-(--radius-xl) border-2 border-border py-4 px-5">
        <div className="mb-2">
          <span className="text-[13px] font-bold text-text-primary">
            <BookOpen size={14} className="text-accent inline-block mr-1" /> Sentence {currentIdx + 1} of {sentences.length}
          </span>
          <span className="text-xs font-bold text-accent">{progress}% completed</span>
        </div>
        <div className="h-[6px] overflow-hidden"
          style={{ borderRadius: 3, background: "var(--border)" }}
        >
          <m.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full"
            style={{
              borderRadius: 3,
              background: "linear-gradient(90deg, var(--accent), var(--xp))",
            }}
          />
        </div>
        {/* Sentence dots */}
        <div className="mt-2.5">
          {sentences.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setCurrentIdx(i);
                setStep("idle");
                setEvalResult(null);
              }}
              className="w-[24px] h-[24px] rounded-md text-[10px] font-bold cursor-pointer grid"
              style={{
                border: i === currentIdx ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: sentenceResults[i]
                  ? `color-mix(in srgb, var(--success) 15%, var(--surface))`
                  : i === currentIdx
                    ? "var(--accent-light)"
                    : "var(--surface-alt)",
                color: sentenceResults[i]
                  ? "var(--success)"
                  : i === currentIdx
                    ? "var(--accent)"
                    : "var(--text-muted)",
                placeItems: "center",
                transition: "all 0.15s",
              }}
            >
              {sentenceResults[i] ? <CircleCheckBig size={11} /> : i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current sentence card */}
      <m.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-(--surface) rounded-(--radius-xl) flex flex-col gap-5"
        style={{
          border:
            step === "listening"
              ? "2px solid var(--accent)"
              : step === "recording"
                ? "2px solid var(--error)"
                : "1px solid var(--border)",
          padding: "24px 20px",
          transition: "border-color 0.2s",
        }}
      >
        {/* Reference text */}
        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Model Sentence
          </span>
          <span
            className="text-lg text-text-primary font-semibold block"
            style={{ lineHeight: 1.7 }}
          >
            {currentSentence}
          </span>
        </div>

        {/* Action buttons based on step */}
        <AnimatePresence mode="wait">
          {step === "idle" && (
            <m.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={playReference}
                className="w-full flex items-center justify-center gap-2.5 border-none text-[15px] font-extrabold cursor-pointer font-body"
                style={{
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "var(--text-on-accent)",
                  boxShadow: "0 4px 14px var(--accent-muted)",
                }}
              >
                <Volume2 /> Listen to Model
              </m.button>
            </m.div>
          )}

          {step === "listening" && (
            <m.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
              style={{ padding: "8px 0" }}
            >
              <div>
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-[12px] h-[12px] rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <span className="text-sm font-bold text-accent">
                  Playing model sentence... Listen carefully
                </span>
              </div>
            </m.div>
          )}

          {step === "ready-to-record" && (
            <m.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={playReference}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border-2 border-border bg-surface-alt text-text-secondary text-[13px] font-bold cursor-pointer font-body"
                  style={{ flex: "0 0 auto" }}
                >
                  <PlayCircle size={13} /> Listen Again
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2.5 border-none text-[15px] font-extrabold cursor-pointer font-body"
                  style={{
                    padding: "14px 20px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <Mic size={14} /> Speak Now
                </m.button>
              </div>
            </m.div>
          )}

          {step === "recording" && (
            <m.div
              key="recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div>
                <div>
                  <m.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-[14px] h-[14px] rounded-full"
                    style={{ background: "var(--error)" }}
                  />
                  <span className="text-sm font-bold text-destructive">
                    Recording... Read the sentence above
                  </span>
                </div>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopAndEvaluate}
                  className="flex items-center justify-center gap-2 rounded-xl text-destructive text-sm font-extrabold cursor-pointer font-body"
                  style={{
                    padding: "12px 28px",
                    border: "2px solid var(--error)",
                    background: "rgba(239, 68, 68, 0.08)",
                  }}
                >
                  <StopCircle size={13} /> Stop & Grade
                </m.button>
              </div>
            </m.div>
          )}

          {step === "evaluating" && (
            <m.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
              style={{ padding: "16px 0" }}
            >
              <Loader2 className="animate-spin text-accent" size={24} />
              <div className="text-sm font-bold text-accent flex items-center justify-center gap-1.5"><Loader2 className="animate-spin" size={14} /> AI is grading your pronunciation...</div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* Result */}
      <AnimatePresence>
        {step === "result" && evalResult && (
          <m.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ShadowResult result={evalResult} referenceText={currentSentence} />

            {/* Action buttons */}
            <div className="mt-3">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={retry}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border bg-(--surface) text-text-primary text-sm font-bold cursor-pointer font-body"
              >
                <Redo size={13} /> Retry
              </m.button>
              {currentIdx < sentences.length - 1 && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-none text-sm font-extrabold cursor-pointer font-body"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "var(--text-on-accent)",
                    boxShadow: "0 4px 14px var(--accent-muted)",
                  }}
                >
                  Next Sentence <ChevronRight />
                </m.button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Summary when all done */}
      {sentenceResults.every(Boolean) && sentenceResults.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-(--radius-xl) text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--xp) 6%, var(--surface)))",
            border: "2px solid var(--accent)",
            padding: "24px 20px",
          }}
        >
          <div className="flex justify-center mb-2"><Award size={40} className="text-accent" /></div>
          <h3 className="mb-2 text-accent">
            Completed!
          </h3>
          <span className="text-sm text-text-secondary block mb-3">
            Average Score:{" "}
            <strong className="text-accent text-lg">
              {Math.round(
                sentenceResults.reduce((sum, r) => sum + (r?.overall ?? 0), 0) /
                  sentenceResults.length,
              )}
            </strong>{" "}
            / 100
          </span>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentIdx(0);
              setStep("idle");
              setEvalResult(null);
              setSentenceResults(new Array(sentences.length).fill(null));
            }}
            className="rounded-xl text-accent text-[13px] font-bold cursor-pointer font-body"
            style={{
              padding: "10px 24px",
              border: "1px solid var(--accent)",
              background: "var(--accent-light)",
            }}
          >
            Practice Again
          </m.button>
        </m.div>
      )}
    </div>
  );
}
