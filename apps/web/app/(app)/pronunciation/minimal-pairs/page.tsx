"use client";

import {
  AimOutlined,
  ArrowRightOutlined,
  AudioOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SoundOutlined,
  SwapOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Progress } from "antd";
import * as m from "motion/react-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { type TtsAccent, useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { api } from "@/lib/api-client";
import {
  getMissedContrastTags,
  type MinimalPair,
  pickRandomPairs,
  summarizeMinimalPairAnswersByTag,
} from "@/lib/pronunciation/minimal-pairs";

type DrillMode = "listen" | "speak";
type SessionState = "setup" | "playing" | "answered" | "result";

type Answer = {
  pair: MinimalPair;
  target: "a" | "b";
  chosen: "a" | "b" | null;
  correct: boolean;
};

type Weakness = { tag: string; total: number; correct: number; accuracy: number };

const QUESTIONS_PER_SESSION = 10;
const SPEAK_PASS_THRESHOLD = 70;
const ACCENT_OPTIONS: Array<{ value: TtsAccent; label: string; flag: string }> = [
  { value: "us", label: "US Accent", flag: "🇺🇸" },
  { value: "uk", label: "UK Accent", flag: "🇬🇧" },
  { value: "au", label: "AU Accent", flag: "🇦🇺" },
];

export default function MinimalPairsDrillPage() {
  const [mode, setMode] = useState<DrillMode>("listen");
  const [state, setState] = useState<SessionState>("setup");
  const [pairs, setPairs] = useState<MinimalPair[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [target, setTarget] = useState<"a" | "b">("a");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [speakError, setSpeakError] = useState<string | null>(null);

  const { speak, isSpeaking, isLoading: isTtsLoading, accent, setAccent } = useTextToSpeech();
  const voice = useVoiceInput({ autoTranscribe: false });

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentPair = pairs[currentIdx] ?? null;

  const loadWeaknesses = useCallback(async () => {
    try {
      const data = await api.get<{ weakest: Weakness[] }>("/pronunciation/minimal-pairs");
      if (isMountedRef.current) setWeaknesses(data.weakest ?? []);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void loadWeaknesses();
  }, [loadWeaknesses]);

  const startSession = useCallback((focusTags?: string[]) => {
    const selected = pickRandomPairs(QUESTIONS_PER_SESSION, focusTags);
    if (selected.length === 0) {
      setSessionError("Không tìm thấy cặp âm phù hợp để luyện tập.");
      setState("setup");
      return;
    }

    setPairs(selected);
    setCurrentIdx(0);
    setAnswers([]);
    setFeedback(null);
    setSessionError(null);
    setSpeakError(null);
    setIsSaving(false);
    setState("playing");

    const t = Math.random() < 0.5 ? "a" : "b";
    setTarget(t);
  }, []);

  const playTarget = useCallback(() => {
    if (!currentPair) return;
    const word = target === "a" ? currentPair.a : currentPair.b;
    void speak(word);
  }, [currentPair, target, speak]);

  useEffect(() => {
    if (state === "playing" && mode === "listen" && currentPair && feedback === null) {
      const timer = setTimeout(() => playTarget(), 300);
      return () => clearTimeout(timer);
    }
  }, [state, mode, currentPair, feedback, playTarget]);

  const chooseAnswer = useCallback(
    (choice: "a" | "b") => {
      if (!currentPair || feedback !== null) return;
      const isCorrect = choice === target;
      setFeedback(isCorrect ? "correct" : "wrong");
      setAnswers((prev) => [
        ...prev,
        {
          pair: currentPair,
          target,
          chosen: choice,
          correct: isCorrect,
        },
      ]);
    },
    [currentPair, target, feedback],
  );

  const startSpeakAttempt = useCallback(async () => {
    if (!currentPair) return;
    setFeedback(null);
    setSpeakError(null);
    try {
      await voice.start();
    } catch {
      // handled by hook
    }
  }, [currentPair, voice]);

  const stopSpeakAttempt = useCallback(async () => {
    setSpeakError(null);
    voice.stop();
    setIsEvaluating(true);
  }, [voice]);

  useEffect(() => {
    if (!isEvaluating || voice.isListening || voice.isTranscribing || voice.blob) return;

    const timer = setTimeout(() => {
      if (!isMountedRef.current || voice.blob) return;
      setIsEvaluating(false);
      setSpeakError("Không nhận được âm thanh. Vui lòng ghi âm lại.");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isEvaluating, voice.isListening, voice.isTranscribing, voice.blob]);

  useEffect(() => {
    if (!isEvaluating || !currentPair) return;
    if (voice.isTranscribing) return;
    if (!voice.blob) return;

    const targetWord = target === "a" ? currentPair.a : currentPair.b;

    const evaluate = async () => {
      try {
        const formData = new FormData();
        formData.append("audio", voice.blob!, "recording.webm");
        formData.append("durationMs", String(Math.round(voice.durationMs)));

        const transcription = await api.post<{ text: string }>("/voice/transcribe", formData);

        const scoreResult = await api.post<{ overall: number }>("/pronunciation/score", {
          referenceText: targetWord,
          spokenText: transcription.text,
          accent,
        });

        if (!isMountedRef.current) return;

        const isCorrect = scoreResult.overall >= SPEAK_PASS_THRESHOLD;
        setFeedback(isCorrect ? "correct" : "wrong");
        setAnswers((prev) => [
          ...prev,
          {
            pair: currentPair,
            target,
            chosen: isCorrect ? target : null,
            correct: isCorrect,
          },
        ]);
      } catch {
        if (!isMountedRef.current) return;
        setFeedback(null);
        setSpeakError("Không thể xử lý bản ghi. Vui lòng thử lại.");
      } finally {
        if (isMountedRef.current) setIsEvaluating(false);
      }
    };
    void evaluate();
  }, [
    isEvaluating,
    voice.blob,
    voice.isTranscribing,
    voice.durationMs,
    currentPair,
    target,
    accent,
  ]);

  const nextQuestion = useCallback(async () => {
    if (isSaving) return;

    const nextIdx = currentIdx + 1;
    if (nextIdx >= pairs.length) {
      const correctCount = answers.filter((a) => a.correct).length;
      const tagStats = summarizeMinimalPairAnswersByTag(answers);
      const focusTags = getMissedContrastTags(answers);

      setIsSaving(true);
      try {
        await api.post("/pronunciation/minimal-pairs", {
          mode,
          total: pairs.length,
          correct: correctCount,
          focusTags,
          tagStats,
        });
        await loadWeaknesses();
      } catch {
        // Non-fatal
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
          setState("result");
        }
      }
      return;
    }

    setCurrentIdx(nextIdx);
    setFeedback(null);
    setSpeakError(null);
    setTarget(Math.random() < 0.5 ? "a" : "b");
  }, [currentIdx, pairs, answers, mode, isSaving, loadWeaknesses]);

  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  const wrongTags = useMemo(() => {
    return getMissedContrastTags(answers);
  }, [answers]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Styled Gradient Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<SwapOutlined />}
          gradient="var(--gradient-pronunciation)"
          title="Luyện âm cặp tối thiểu"
          subtitle="Minimal Pairs Drill · Phân biệt các phụ âm / nguyên âm dễ gây nhầm lẫn"
        />
      </div>

      {/* Main Container */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 80px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Weaknesses card */}
          {weaknesses.length > 0 && state === "setup" && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 18,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <BarChartOutlined style={{ color: "var(--accent)" }} /> Cặp âm cần cải thiện
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {weaknesses.map((w) => {
                  const tagColor =
                    w.accuracy >= 80
                      ? "var(--success)"
                      : w.accuracy >= 50
                        ? "var(--warning)"
                        : "var(--error)";
                  return (
                    <m.button
                      key={w.tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startSession([w.tag])}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: `1.5px solid color-mix(in srgb, ${tagColor} 20%, transparent)`,
                        background: `color-mix(in srgb, ${tagColor} 8%, var(--surface-alt))`,
                        color: tagColor,
                        cursor: "pointer",
                      }}
                    >
                      {w.tag}: {w.accuracy}%
                    </m.button>
                  );
                })}
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  margin: "10px 0 0",
                  fontWeight: 500,
                }}
              >
                💡 Click trực tiếp vào thẻ trên để luyện tập tập trung vào cặp âm đó
              </p>
            </m.div>
          )}

          {/* Setup session card */}
          {state === "setup" && (
            <m.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: "center",
                padding: "36px 24px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-md)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "0%",
                  transform: "translateX(-50%)",
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)",
                  pointerEvents: "none",
                  opacity: 0.5,
                }}
              />

              <SwapOutlined
                style={{
                  fontSize: 44,
                  color: "var(--accent)",
                  marginBottom: 14,
                  position: "relative",
                  zIndex: 1,
                }}
              />
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: 18.5,
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Thiết lập phiên luyện tập
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: "0 0 24px",
                  fontSize: 13,
                  fontWeight: 600,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Phân biệt âm thanh (Nghe) hoặc luyện phát âm trực quan (Nói)
              </p>

              {/* Mode Selector */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                {(["listen", "speak"] as const).map((mKey) => {
                  const isActive = mode === mKey;
                  return (
                    <m.button
                      key={mKey}
                      onClick={() => setMode(mKey)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: "var(--radius-lg)",
                        border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                        background: isActive ? "var(--accent-light)" : "var(--surface-alt)",
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        fontWeight: 800,
                        cursor: "pointer",
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {mKey === "listen" ? <SoundOutlined /> : <AudioOutlined />}
                      <span>{mKey === "listen" ? "Chế độ Nghe" : "Chế độ Nói"}</span>
                    </m.button>
                  );
                })}
              </div>

              {/* Accent Selector */}
              <div
                style={{
                  marginBottom: 24,
                  borderTop: "1.5px dashed var(--border)",
                  paddingTop: 16,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  <GlobalOutlined /> Giọng đọc mặc định
                </span>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {ACCENT_OPTIONS.map((option) => {
                    const isActive = accent === option.value;
                    return (
                      <m.button
                        key={option.value}
                        onClick={() => setAccent(option.value)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          minWidth: 80,
                          padding: "6px 0",
                          borderRadius: 8,
                          border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                          background: isActive ? "var(--accent-light)" : "var(--surface-alt)",
                          color: isActive ? "var(--accent)" : "var(--text-secondary)",
                          fontWeight: 800,
                          cursor: "pointer",
                          fontSize: 11.5,
                        }}
                      >
                        {option.flag} {option.label}
                      </m.button>
                    );
                  })}
                </div>
              </div>

              <m.button
                onClick={() => startSession()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 42,
                  width: "100%",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  color: "var(--text-on-accent)",
                  fontSize: 14.5,
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px var(--accent-muted)",
                }}
              >
                Bắt đầu ngay (10 câu)
              </m.button>

              {sessionError && (
                <p
                  style={{
                    color: "var(--error)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    margin: "12px 0 0",
                  }}
                >
                  ⚠️ {sessionError}
                </p>
              )}
            </m.div>
          )}

          {/* Playing — Listen Mode */}
          {state === "playing" && mode === "listen" && currentPair && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Progress */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: 16,
                  boxShadow: "var(--shadow-sm)",
                  gap: 10,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 800 }}>
                    Câu hỏi {currentIdx + 1} / {pairs.length}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-muted)",
                    }}
                  >
                    Cặp âm: {currentPair.contrast}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIdx + 1) / pairs.length) * 100}%` }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, var(--accent), var(--secondary))",
                    }}
                  />
                </div>
              </div>

              {/* Play Audio Button */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: 32,
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <m.button
                  onClick={playTarget}
                  disabled={isTtsLoading || isSpeaking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                    fontSize: 26,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px var(--accent-muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isTtsLoading ? 0.6 : 1,
                  }}
                  aria-label="Phát lại"
                >
                  {isTtsLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
                </m.button>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    marginTop: 10,
                    fontWeight: 700,
                  }}
                >
                  Nhấn để nghe lại phát âm mẫu
                </p>
              </div>

              {/* Choices layout */}
              <div style={{ display: "flex", gap: 12 }}>
                {(["a", "b"] as const).map((side) => {
                  const word = side === "a" ? currentPair.a : currentPair.b;
                  const isChosen = feedback !== null && answers.at(-1)?.chosen === side;
                  const isTarget = feedback !== null && target === side;

                  let bg = "var(--surface)";
                  let border = "1.5px solid var(--border)";
                  let color = "var(--text-primary)";

                  if (feedback !== null) {
                    if (isTarget) {
                      bg = "rgba(16, 185, 129, 0.08)";
                      border = "2px solid var(--success)";
                      color = "var(--success)";
                    } else if (isChosen && !isTarget) {
                      bg = "rgba(239, 68, 68, 0.08)";
                      border = "2px solid var(--error)";
                      color = "var(--error)";
                    } else {
                      bg = "var(--surface-alt)";
                      border = "1.5px solid var(--border)";
                    }
                  }

                  return (
                    <m.button
                      key={side}
                      onClick={() => chooseAnswer(side)}
                      disabled={feedback !== null}
                      whileHover={feedback !== null ? {} : { scale: 1.01, y: -2 }}
                      whileTap={feedback !== null ? {} : { scale: 0.99 }}
                      style={{
                        flex: 1,
                        padding: "24px 16px",
                        borderRadius: "var(--radius-xl)",
                        border,
                        background: bg,
                        color,
                        cursor: feedback !== null ? "default" : "pointer",
                        fontSize: 20,
                        fontWeight: 800,
                        transition: "all 0.15s",
                        boxShadow: "var(--shadow-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span>{word}</span>
                      {feedback !== null && isTarget && (
                        <CheckCircleOutlined style={{ color: "var(--success)" }} />
                      )}
                      {feedback !== null && isChosen && !isTarget && (
                        <CloseCircleOutlined style={{ color: "var(--error)" }} />
                      )}
                    </m.button>
                  );
                })}
              </div>

              {/* Next trigger button */}
              {feedback !== null && (
                <m.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={nextQuestion}
                  disabled={isSaving}
                  style={{
                    height: 42,
                    width: "100%",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px var(--accent-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {isSaving ? (
                    <LoadingOutlined spin />
                  ) : currentIdx + 1 < pairs.length ? (
                    <>
                      <span>Câu tiếp theo</span>
                      <ArrowRightOutlined />
                    </>
                  ) : (
                    "Hoàn thành và Xem kết quả"
                  )}
                </m.button>
              )}
            </div>
          )}

          {/* Playing — Speak Mode */}
          {state === "playing" && mode === "speak" && currentPair && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Progress */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: 16,
                  boxShadow: "var(--shadow-sm)",
                  gap: 10,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 800 }}>
                    Câu hỏi {currentIdx + 1} / {pairs.length}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-muted)",
                    }}
                  >
                    Cặp âm: {currentPair.contrast}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIdx + 1) / pairs.length) * 100}%` }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, var(--accent), var(--secondary))",
                    }}
                  />
                </div>
              </div>

              {/* Target cards */}
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 24px",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: "var(--accent)",
                  }}
                />
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 10px",
                  }}
                >
                  Vui lòng nói từ dưới đây:
                </p>
                <h2
                  style={{ fontSize: 44, fontWeight: 900, margin: 0, color: "var(--text-primary)" }}
                >
                  {target === "a" ? currentPair.a : currentPair.b}
                </h2>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    margin: "8px 0 16px",
                    fontWeight: 600,
                  }}
                >
                  (Chú ý phân biệt với âm của từ: &ldquo;
                  {target === "a" ? currentPair.b : currentPair.a}&rdquo;)
                </p>

                {/* Reference sound button */}
                <m.button
                  onClick={() => speak(target === "a" ? currentPair.a : currentPair.b)}
                  disabled={isTtsLoading || isSpeaking}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <SoundOutlined /> Nghe phát âm mẫu
                </m.button>
              </div>

              {/* Recording trigger card */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: 24,
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {!voice.isListening && !isEvaluating && feedback === null && (
                  <m.button
                    onClick={startSpeakAttempt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      border: "none",
                      background:
                        "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, white))",
                      color: "var(--text-on-accent)",
                      fontSize: 26,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Bắt đầu ghi âm"
                  >
                    <AudioOutlined />
                  </m.button>
                )}

                {voice.isListening && (
                  <m.button
                    onClick={stopSpeakAttempt}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      border: "3px solid var(--error)",
                      background: "var(--surface-alt)",
                      color: "var(--error)",
                      fontSize: 20,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Dừng ghi âm"
                  >
                    ⏹
                  </m.button>
                )}

                {isEvaluating && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LoadingOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Đang phân tích phát âm...
                    </p>
                  </div>
                )}

                {speakError && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--error)",
                      fontWeight: 700,
                      margin: "10px 0 0",
                    }}
                  >
                    ⚠️ {speakError}
                  </p>
                )}

                {/* Score response indicators */}
                {feedback !== null && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 16,
                      fontWeight: 800,
                      color: feedback === "correct" ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {feedback === "correct" ? (
                      <>
                        <CheckCircleOutlined />
                        <span>Phát âm rất chuẩn!</span>
                      </>
                    ) : (
                      <>
                        <CloseCircleOutlined />
                        <span>Chưa chính xác — Hãy nghe lại âm mẫu</span>
                      </>
                    )}
                  </m.div>
                )}
              </div>

              {/* Next trigger button */}
              {feedback !== null && (
                <m.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={nextQuestion}
                  disabled={isSaving}
                  style={{
                    height: 42,
                    width: "100%",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px var(--accent-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {isSaving ? (
                    <LoadingOutlined spin />
                  ) : currentIdx + 1 < pairs.length ? (
                    <>
                      <span>Câu tiếp theo</span>
                      <ArrowRightOutlined />
                    </>
                  ) : (
                    "Hoàn thành và Xem kết quả"
                  )}
                </m.button>
              )}
            </div>
          )}

          {/* Result view */}
          {state === "result" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Circular Score card */}
              <div
                style={{
                  padding: "36px 24px",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                  boxShadow: "var(--shadow-md)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "20%",
                    transform: "translate(-50%, -50%)",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)",
                    pointerEvents: "none",
                    opacity: 0.4,
                  }}
                />

                <Progress
                  type="circle"
                  percent={accuracy}
                  size={110}
                  strokeColor={
                    accuracy >= 80
                      ? "var(--success)"
                      : accuracy >= 50
                        ? "var(--warning)"
                        : "var(--error)"
                  }
                  format={(pct) => (
                    <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)" }}>
                      {pct}%
                    </span>
                  )}
                />
                <h4
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "16px 0 4px",
                  }}
                >
                  Hoàn thành luyện tập!
                </h4>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  Đúng {correctCount} / {answers.length} câu · Chế độ{" "}
                  {mode === "listen" ? "Nghe" : "Nói"}
                </p>
              </div>

              {/* Answer log lists */}
              <div
                style={{
                  padding: 20,
                  borderRadius: "var(--radius-xl)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: 14,
                  }}
                >
                  Chi tiết kết quả các câu hỏi
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {answers.map((ans, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-lg)",
                        background: ans.correct
                          ? "rgba(16, 185, 129, 0.04)"
                          : "rgba(239, 68, 68, 0.04)",
                        border: `1px solid ${ans.correct ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
                      }}
                    >
                      {ans.correct ? (
                        <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 14 }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 14 }} />
                      )}

                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                        {ans.pair.a} / {ans.pair.b}
                      </span>

                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "var(--surface-alt)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          marginLeft: "auto",
                        }}
                      >
                        {ans.pair.contrast}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missed contrast tags focus list */}
              {wrongTags.length > 0 && (
                <div
                  style={{
                    padding: 20,
                    borderRadius: "var(--radius-xl)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    <AimOutlined style={{ color: "var(--error)" }} /> Cần luyện tập bổ sung
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {wrongTags.map((tag) => (
                      <m.button
                        key={tag}
                        onClick={() => startSession([tag])}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "4px 12px",
                          borderRadius: 8,
                          border: "1.5px solid rgba(239, 68, 68, 0.2)",
                          background: "rgba(239, 68, 68, 0.06)",
                          color: "var(--error)",
                          cursor: "pointer",
                        }}
                      >
                        {tag}
                      </m.button>
                    ))}
                  </div>
                </div>
              )}

              {/* End of Session Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {wrongTags.length > 0 && (
                  <m.button
                    onClick={() => startSession(wrongTags)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: "var(--radius-lg)",
                      border: "1.5px solid var(--error)",
                      background: "transparent",
                      color: "var(--error)",
                      cursor: "pointer",
                      fontSize: 13.5,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <TrophyOutlined /> Luyện lại cặp âm sai
                  </m.button>
                )}

                <m.button
                  onClick={() => setState("setup")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                    cursor: "pointer",
                    fontSize: 13.5,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px var(--accent-muted)",
                  }}
                >
                  <ReloadOutlined /> Phiên mới ngẫu nhiên
                </m.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
