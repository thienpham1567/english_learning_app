"use client";

import { useState, useCallback, useRef } from "react";
import { Flex, Typography, message } from "antd";

import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { splitIntoSentences } from "../_hooks/useSentences";
import { ShadowResult, type EvalResult } from "./ShadowResult";
import {
  ChevronRight,
  CircleCheckBig,
  Loader2,
  Mic,
  PlayCircle,
  Redo,
  StopCircle,
  Volume2,
} from "lucide-react";

const { Text, Title } = Typography;

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
  const [sentenceResults, setSentenceResults] = useState<(EvalResult | null)[]>(new Array(sentences.length).fill(null));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voice = useVoiceInput({ autoTranscribe: false });

  const currentSentence = sentences[currentIdx] ?? "";
  const progress = sentences.length > 0 ? Math.round(((sentenceResults.filter(Boolean).length) / sentences.length) * 100) : 0;

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
        message.error("Lỗi phát audio");
        setStep("idle");
      };
      await audio.play();
    } catch {
      message.error("Không thể phát câu mẫu");
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
      message.error("Không có bản ghi âm");
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
          message.warning("Không nhận dạng được giọng nói. Hãy nói rõ hơn và thử lại.");
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
      message.error(err instanceof Error ? err.message : "Lỗi chấm điểm");
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
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "40px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
        <Title level={4} style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>
          Shadowing Mode
        </Title>
        <Text style={{ color: "var(--text-muted)", display: "block", maxWidth: 400, margin: "0 auto" }}>
          Hãy nhập hoặc chọn một đoạn văn ở tab &quot;Nghe&quot; trước, sau đó quay lại đây để luyện đọc theo.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Progress bar */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "16px 20px",
      }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            📖 Câu {currentIdx + 1} / {sentences.length}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
            {progress}% hoàn thành
          </Text>
        </Flex>
        <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
          <m.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, var(--accent), var(--xp))" }}
          />
        </div>
        {/* Sentence dots */}
        <Flex gap={4} style={{ marginTop: 10 }} wrap="wrap">
          {sentences.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setCurrentIdx(i); setStep("idle"); setEvalResult(null); }}
              style={{
                width: 24, height: 24, borderRadius: 6,
                border: i === currentIdx ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: sentenceResults[i]
                  ? `color-mix(in srgb, var(--success) 15%, var(--surface))`
                  : i === currentIdx
                    ? "var(--accent-light)"
                    : "var(--surface-alt)",
                color: sentenceResults[i] ? "var(--success)" : i === currentIdx ? "var(--accent)" : "var(--text-muted)",
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                display: "grid", placeItems: "center",
                transition: "all 0.15s",
              }}
            >
              {sentenceResults[i] ? <CircleCheckBig size={11} /> : i + 1}
            </button>
          ))}
        </Flex>
      </div>

      {/* Current sentence card */}
      <m.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          border: step === "listening" ? "2px solid var(--accent)" : step === "recording" ? "2px solid var(--error)" : "1px solid var(--border)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          transition: "border-color 0.2s",
        }}
      >
        {/* Reference text */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>
            🔊 Câu mẫu
          </Text>
          <Text style={{
            fontSize: 18,
            lineHeight: 1.7,
            color: "var(--text-primary)",
            fontWeight: 600,
            display: "block",
          }}>
            {currentSentence}
          </Text>
        </div>

        {/* Action buttons based on step */}
        <AnimatePresence mode="wait">
          {step === "idle" && (
            <m.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={playReference}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 10, padding: "14px 20px", borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "var(--text-on-accent)", fontSize: 15, fontWeight: 800,
                  cursor: "pointer", fontFamily: "var(--font-body)",
                  boxShadow: "0 4px 14px var(--accent-muted)",
                }}
              >
                <Volume2 /> Nghe câu mẫu
              </m.button>
            </m.div>
          )}

          {step === "listening" && (
            <m.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "8px 0" }}>
              <Flex align="center" justify="center" gap={8}>
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                  Đang phát câu mẫu... Hãy lắng nghe kỹ
                </Text>
              </Flex>
            </m.div>
          )}

          {step === "ready-to-record" && (
            <m.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Flex gap={8}>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={playReference}
                  style={{
                    flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "12px 16px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--surface-alt)",
                    color: "var(--text-secondary)", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  <PlayCircle /> Nghe lại
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 10, padding: "14px 20px", borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff", fontSize: 15, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <Mic /> 🎙️ Đọc theo
                </m.button>
              </Flex>
            </m.div>
          )}

          {step === "recording" && (
            <m.div key="recording" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Flex vertical gap={12} align="center">
                <Flex align="center" gap={8}>
                  <m.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: "var(--error)",
                    }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--error)" }}>
                    Đang ghi âm... Hãy đọc câu ở trên
                  </Text>
                </Flex>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopAndEvaluate}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "12px 28px", borderRadius: 12,
                    border: "2px solid var(--error)",
                    background: "rgba(239, 68, 68, 0.08)",
                    color: "var(--error)", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  <StopCircle /> Dừng & chấm điểm
                </m.button>
              </Flex>
            </m.div>
          )}

          {step === "evaluating" && (
            <m.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "16px 0" }}>
              <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                🤖 AI đang chấm điểm phát âm...
              </div>
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
            <Flex gap={8} style={{ marginTop: 12 }}>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={retry}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "12px 16px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--surface)",
                  color: "var(--text-primary)", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}
              >
                <Redo /> Thử lại
              </m.button>
              {currentIdx < sentences.length - 1 && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToNext}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "12px 16px", borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "var(--text-on-accent)", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                    boxShadow: "0 4px 14px var(--accent-muted)",
                  }}
                >
                  Câu tiếp theo <ChevronRight />
                </m.button>
              )}
            </Flex>
          </m.div>
        )}
      </AnimatePresence>

      {/* Summary when all done */}
      {sentenceResults.every(Boolean) && sentenceResults.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--xp) 6%, var(--surface)))",
            borderRadius: "var(--radius-xl)",
            border: "2px solid var(--accent)",
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <Title level={4} style={{ margin: "0 0 8px", color: "var(--accent)" }}>
            Hoàn thành!
          </Title>
          <Text style={{ fontSize: 14, color: "var(--text-secondary)", display: "block", marginBottom: 12 }}>
            Điểm trung bình: <strong style={{ color: "var(--accent)", fontSize: 18 }}>
              {Math.round(sentenceResults.reduce((sum, r) => sum + (r?.overall ?? 0), 0) / sentenceResults.length)}
            </strong> / 100
          </Text>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentIdx(0);
              setStep("idle");
              setEvalResult(null);
              setSentenceResults(new Array(sentences.length).fill(null));
            }}
            style={{
              padding: "10px 24px", borderRadius: 12,
              border: "1px solid var(--accent)", background: "var(--accent-light)",
              color: "var(--accent)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "var(--font-body)",
            }}
          >
            🔄 Luyện lại từ đầu
          </m.button>
        </m.div>
      )}
    </div>
  );
}
