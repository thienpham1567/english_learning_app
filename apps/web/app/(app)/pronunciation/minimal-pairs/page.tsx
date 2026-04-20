"use client";

import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  AudioOutlined,
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";

import { useTextToSpeech, type TtsAccent } from "@/hooks/useTextToSpeech";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  type MinimalPair,
  getMissedContrastTags,
  pickRandomPairs,
  summarizeMinimalPairAnswersByTag,
} from "@/lib/pronunciation/minimal-pairs";

/* ── Types ─────────────────────────────────────────────────── */

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
const ACCENT_OPTIONS: Array<{ value: TtsAccent; label: string }> = [
  { value: "us", label: "US" },
  { value: "uk", label: "UK" },
  { value: "au", label: "AU" },
];

/* ── Component ─────────────────────────────────────────────── */

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

  const {
    speak,
    isSpeaking,
    isLoading: isTtsLoading,
    accent,
    setAccent,
  } = useTextToSpeech();
  const voice = useVoiceInput({ autoTranscribe: false });

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const currentPair = pairs[currentIdx] ?? null;

  /* ── Load weaknesses on mount ──────────────── */

  const loadWeaknesses = useCallback(async () => {
    try {
      const data = await api.get<{ weakest: Weakness[] }>("/pronunciation/minimal-pairs");
      if (isMountedRef.current) setWeaknesses(data.weakest ?? []);
    } catch {
      // Non-fatal: the drill still works without history.
    }
  }, []);

  useEffect(() => {
    void loadWeaknesses();
  }, [loadWeaknesses]);

  /* ── Start session ─────────────────────────── */

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

    // Pick random target for first question
    const t = Math.random() < 0.5 ? "a" : "b";
    setTarget(t);
  }, []);

  /* ── Listen mode: play target word ─────────── */

  const playTarget = useCallback(() => {
    if (!currentPair) return;
    const word = target === "a" ? currentPair.a : currentPair.b;
    void speak(word);
  }, [currentPair, target, speak]);

  // Auto-play when entering a new question in listen mode
  useEffect(() => {
    if (state === "playing" && mode === "listen" && currentPair && feedback === null) {
      const timer = setTimeout(() => playTarget(), 300);
      return () => clearTimeout(timer);
    }
  }, [state, mode, currentPair, feedback, playTarget]);

  /* ── Listen mode: choose answer ────────────── */

  const chooseAnswer = useCallback((choice: "a" | "b") => {
    if (!currentPair || feedback !== null) return;
    const isCorrect = choice === target;
    setFeedback(isCorrect ? "correct" : "wrong");
    setAnswers((prev) => [...prev, {
      pair: currentPair,
      target,
      chosen: choice,
      correct: isCorrect,
    }]);
  }, [currentPair, target, feedback]);

  /* ── Speak mode: record and score ──────────── */

  const startSpeakAttempt = useCallback(async () => {
    if (!currentPair) return;
    setFeedback(null);
    setSpeakError(null);
    try {
      await voice.start();
    } catch {
      // mic error handled by hook
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

  // Watch for blob ready → score via pronunciation endpoint
  useEffect(() => {
    if (!isEvaluating || !currentPair) return;
    if (voice.isTranscribing) return;
    if (!voice.blob) return;

    const targetWord = target === "a" ? currentPair.a : currentPair.b;

    const evaluate = async () => {
      try {
        // Send to transcribe first
        const formData = new FormData();
        formData.append("audio", voice.blob!, "recording.webm");
        formData.append("durationMs", String(Math.round(voice.durationMs)));

        const transcription = await api.post<{ text: string }>("/voice/transcribe", formData);

        // Then score
        const scoreResult = await api.post<{ overall: number }>("/pronunciation/score", {
          referenceText: targetWord,
          spokenText: transcription.text,
          accent,
        });

        if (!isMountedRef.current) return;

        const isCorrect = scoreResult.overall >= SPEAK_PASS_THRESHOLD;
        setFeedback(isCorrect ? "correct" : "wrong");
        setAnswers((prev) => [...prev, {
          pair: currentPair,
          target,
          chosen: isCorrect ? target : null,
          correct: isCorrect,
        }]);
      } catch {
        if (!isMountedRef.current) return;
        setFeedback(null);
        setSpeakError("Không thể xử lý bản ghi. Vui lòng thử lại.");
      } finally {
        if (isMountedRef.current) setIsEvaluating(false);
      }
    };
    void evaluate();
  }, [isEvaluating, voice.blob, voice.isTranscribing, voice.durationMs, currentPair, target, accent]);

  /* ── Next question / finish ────────────────── */

  const nextQuestion = useCallback(async () => {
    if (isSaving) return;

    const nextIdx = currentIdx + 1;
    if (nextIdx >= pairs.length) {
      // Session complete — persist
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
        // Non-fatal: show the session result even if persistence fails.
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

  /* ── Derived ───────────────────────────────── */

  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const scoreColor = (s: number) => (s >= 80 ? "#52c41a" : s >= 50 ? "#faad14" : "#ff4d4f");

  // Focus queue: tags the user got wrong in this session
  const wrongTags = useMemo(() => {
    return getMissedContrastTags(answers);
  }, [answers]);

  /* ── Render ──────────────────────────────────── */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <SwapOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Minimal Pairs Drill</h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Luyện phân biệt cặp âm tối thiểu — nghe hoặc nói để nhận biết sự khác biệt
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>

        {/* Weakness block (AC6) — always visible */}
        {weaknesses.length > 0 && state === "setup" && (
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 20,
            background: "var(--card-bg)", border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
              <BarChartOutlined /> Cặp âm yếu nhất
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {weaknesses.map((w) => (
                <Tag
                  key={w.tag}
                  color={w.accuracy >= 80 ? "success" : w.accuracy >= 50 ? "warning" : "error"}
                  style={{ fontSize: 12, cursor: "pointer", padding: "3px 10px" }}
                  onClick={() => startSession([w.tag])}
                >
                  {w.tag}: {w.accuracy}%
                </Tag>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Nhấn vào tag để luyện tập cặp âm đó
            </p>
          </div>
        )}

        {/* Setup */}
        {state === "setup" && (
          <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
            <SwapOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px" }}>Chọn chế độ luyện tập</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
              <strong>Nghe</strong>: nghe phát âm rồi chọn từ đúng &nbsp;|&nbsp; <strong>Nói</strong>: phát âm từ được chọn
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
              {(["listen", "speak"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "12px 24px", borderRadius: 10,
                    border: mode === m ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: mode === m ? "var(--accent-muted)" : "transparent",
                    color: mode === m ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: mode === m ? 600 : 400, cursor: "pointer", fontSize: 14,
                  }}
                >
                  {m === "listen" ? "🎧 Nghe" : "🎤 Nói"}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 8px", fontSize: 12, fontWeight: 600 }}>
                Giọng đọc
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {ACCENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAccent(option.value)}
                    style={{
                      minWidth: 52, padding: "7px 12px", borderRadius: 8,
                      border: accent === option.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: accent === option.value ? "var(--accent-muted)" : "transparent",
                      color: accent === option.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: accent === option.value ? 600 : 400,
                      cursor: "pointer", fontSize: 12,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => startSession()}
              style={{
                padding: "12px 32px", borderRadius: 10, border: "none",
                background: "var(--accent)", color: "#fff", fontSize: 15,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Bắt đầu ({QUESTIONS_PER_SESSION} câu)
            </button>

            {sessionError && (
              <p style={{ color: "#ff4d4f", fontSize: 12, margin: "12px 0 0" }}>
                {sessionError}
              </p>
            )}
          </div>
        )}

        {/* Playing — Listen Mode */}
        {state === "playing" && mode === "listen" && currentPair && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                {currentIdx + 1}/{pairs.length}
              </span>
              <Progress
                percent={((currentIdx + 1) / pairs.length) * 100}
                showInfo={false}
                size="small"
                style={{ flex: 1 }}
              />
              <Tag color="blue" style={{ fontSize: 11 }}>{currentPair.contrast}</Tag>
            </div>

            {/* Play button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={playTarget}
                disabled={isTtsLoading || isSpeaking}
                style={{
                  width: 80, height: 80, borderRadius: "50%", border: "none",
                  background: "linear-gradient(135deg, var(--accent), #4ecdc4)",
                  color: "#fff", fontSize: 28, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  opacity: isTtsLoading ? 0.5 : 1,
                }}
                aria-label="Phát lại"
              >
                {isTtsLoading ? <LoadingOutlined /> : <SoundOutlined />}
              </button>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                Nhấn để nghe lại
              </p>
            </div>

            {/* Choice buttons */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {(["a", "b"] as const).map((side) => {
                const word = side === "a" ? currentPair.a : currentPair.b;
                const isChosen = feedback !== null && answers.at(-1)?.chosen === side;
                const isTarget = feedback !== null && target === side;

                let bg = "var(--card-bg)";
                let border = "1px solid var(--border)";
                if (feedback !== null) {
                  if (isTarget) { bg = "#f6ffed"; border = "2px solid #52c41a"; }
                  else if (isChosen && !isTarget) { bg = "#fff2f0"; border = "2px solid #ff4d4f"; }
                }

                return (
                  <button
                    key={side}
                    onClick={() => chooseAnswer(side)}
                    disabled={feedback !== null}
                    style={{
                      flex: 1, padding: "20px 16px", borderRadius: 12,
                      border, background: bg, cursor: feedback !== null ? "default" : "pointer",
                      fontSize: 20, fontWeight: 600, transition: "all 0.2s",
                    }}
                  >
                    {word}
                    {feedback !== null && isTarget && <CheckCircleOutlined style={{ marginLeft: 8, color: "#52c41a" }} />}
                    {feedback !== null && isChosen && !isTarget && <CloseCircleOutlined style={{ marginLeft: 8, color: "#ff4d4f" }} />}
                  </button>
                );
              })}
            </div>

            {/* Next button after answering */}
            {feedback !== null && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={nextQuestion}
                  disabled={isSaving}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "#fff", fontSize: 14,
                    fontWeight: 600, cursor: isSaving ? "default" : "pointer",
                    opacity: isSaving ? 0.65 : 1,
                  }}
                >
                  {isSaving ? "Đang lưu..." : currentIdx + 1 < pairs.length ? "Câu tiếp →" : "Xem kết quả"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Playing — Speak Mode */}
        {state === "playing" && mode === "speak" && currentPair && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                {currentIdx + 1}/{pairs.length}
              </span>
              <Progress
                percent={((currentIdx + 1) / pairs.length) * 100}
                showInfo={false}
                size="small"
                style={{ flex: 1 }}
              />
              <Tag color="blue" style={{ fontSize: 11 }}>{currentPair.contrast}</Tag>
            </div>

            {/* Target word to pronounce */}
            <div style={{
              textAlign: "center", padding: 32, borderRadius: 16,
              background: "var(--card-bg)", border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px" }}>Hãy nói từ này:</p>
              <p style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>
                {target === "a" ? currentPair.a : currentPair.b}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0" }}>
                (không phải &ldquo;{target === "a" ? currentPair.b : currentPair.a}&rdquo;)
              </p>

              {/* Listen to reference */}
              <button
                onClick={() => speak(target === "a" ? currentPair.a : currentPair.b)}
                disabled={isTtsLoading || isSpeaking}
                style={{
                  marginTop: 12, padding: "6px 14px", borderRadius: 6,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
                }}
              >
                <SoundOutlined /> Nghe mẫu
              </button>
            </div>

            {/* Record button */}
            <div style={{ textAlign: "center" }}>
              {!voice.isListening && !isEvaluating && feedback === null && (
                <button
                  onClick={startSpeakAttempt}
                  style={{
                    width: 80, height: 80, borderRadius: "50%", border: "none",
                    background: "linear-gradient(135deg, #ff4d4f, #ff7875)",
                    color: "#fff", fontSize: 28, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(255,77,79,0.3)",
                  }}
                  aria-label="Bắt đầu ghi âm"
                >
                  <AudioOutlined />
                </button>
              )}

              {voice.isListening && (
                <button
                  onClick={stopSpeakAttempt}
                  style={{
                    width: 80, height: 80, borderRadius: "50%",
                    border: "3px solid #ff4d4f", background: "var(--card-bg)",
                    color: "#ff4d4f", fontSize: 20, cursor: "pointer",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                  aria-label="Dừng ghi âm"
                >
                  ⏹
                </button>
              )}

              {isEvaluating && (
                <div>
                  <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>Đang đánh giá...</p>
                </div>
              )}

              {speakError && (
                <p style={{ fontSize: 13, color: "#ff4d4f", margin: "12px 0 0" }}>
                  {speakError}
                </p>
              )}

              {/* Feedback */}
              {feedback !== null && (
                <div style={{ marginTop: 16 }}>
                  {feedback === "correct" ? (
                    <div style={{ color: "#52c41a", fontSize: 18, fontWeight: 600 }}>
                      <CheckCircleOutlined /> Đúng rồi!
                    </div>
                  ) : (
                    <div style={{ color: "#ff4d4f", fontSize: 18, fontWeight: 600 }}>
                      <CloseCircleOutlined /> Chưa đúng — thử nghe lại mẫu
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Next button */}
            {feedback !== null && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={nextQuestion}
                  disabled={isSaving}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "#fff", fontSize: 14,
                    fontWeight: 600, cursor: isSaving ? "default" : "pointer",
                    opacity: isSaving ? 0.65 : 1,
                  }}
                >
                  {isSaving ? "Đang lưu..." : currentIdx + 1 < pairs.length ? "Câu tiếp →" : "Xem kết quả"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {state === "result" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score */}
            <div style={{
              padding: 24, borderRadius: 16,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <Progress
                type="circle"
                percent={accuracy}
                size={100}
                strokeColor={scoreColor(accuracy)}
                format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}%</span>}
              />
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12 }}>
                {correctCount}/{answers.length} câu đúng — {mode === "listen" ? "🎧 Nghe" : "🎤 Nói"}
              </p>
            </div>

            {/* Answer review */}
            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px", fontWeight: 600 }}>
                Chi tiết
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {answers.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "6px 10px", borderRadius: 6, fontSize: 13,
                      background: a.correct ? "#f6ffed" : "#fff2f0",
                    }}
                  >
                    {a.correct
                      ? <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                    <span style={{ fontWeight: 500 }}>{a.pair.a} / {a.pair.b}</span>
                    <Tag style={{ fontSize: 10, marginLeft: "auto" }}>{a.pair.contrast}</Tag>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus queue (AC4) */}
            {wrongTags.length > 0 && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  🎯 Cần luyện thêm
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {wrongTags.map((tag) => (
                    <Tag key={tag} color="error" style={{ fontSize: 12, cursor: "pointer" }} onClick={() => startSession([tag])}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {wrongTags.length > 0 && (
                <button
                  onClick={() => startSession(wrongTags)}
                  style={{
                    padding: "10px 20px", borderRadius: 8,
                    border: "1px solid #ff4d4f", background: "transparent",
                    color: "#ff4d4f", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}
                >
                  <TrophyOutlined /> Luyện cặp âm yếu
                </button>
              )}
              <button
                onClick={() => setState("setup")}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "none", background: "var(--accent)",
                  color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                <ReloadOutlined /> Phiên mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
