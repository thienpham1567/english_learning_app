"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef } from "react";
import {
  AudioOutlined,
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  BorderOutlined,
} from "@ant-design/icons";
import { Progress, Tag, Tooltip } from "antd";

import { useExamMode } from "@/components/app/shared/ExamModeProvider";

type Sentence = {
  text: string;
  ipa: string;
  tip: string;
};

type WordAnalysis = {
  word: string;
  spoken: string;
  correct: boolean;
  issue?: string;
};

type EvalResult = {
  score: number;
  accuracy: number;
  fluency: number;
  feedback: string;
  wordAnalysis: WordAnalysis[];
  tips: string[];
};

type PracticeState = "idle" | "loading" | "ready" | "recording" | "transcribing" | "evaluating" | "result";

export default function PronunciationPage() {
  const { examMode, label: modeLabel } = useExamMode();
  const [state, setState] = useState<PracticeState>("idle");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [level, setLevel] = useState<string>("intermediate");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const currentSentence = sentences[currentIdx] ?? null;

  // ─── Generate sentences ───
  const startPractice = useCallback(async () => {
    setState("loading");
    setError(null);
    setSessionScores([]);
    setCurrentIdx(0);
    setEvalResult(null);

    try {
      const data = await api.post<{ sentences: Sentence[] }>("/pronunciation/sentences", {
        level, count: 5, examMode,
      });
      if (!data.sentences?.length) throw new Error("No sentences returned");

      setSentences(data.sentences);
      setState("ready");
    } catch {
      setError("Không thể tạo bài tập. Vui lòng thử lại.");
      setState("idle");
    }
  }, [level, examMode]);

  // ─── TTS: Read sentence aloud ───
  const speakSentence = useCallback(() => {
    if (!currentSentence) return;
    const utterance = new SpeechSynthesisUtterance(currentSentence.text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }, [currentSentence]);

  // ─── Recording ───
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ ghi âm. Vui lòng sử dụng Chrome hoặc Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setState("recording");
    } catch {
      setError("Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !currentSentence) return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        // Stop all audio tracks
        recorder.stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("transcribing");

        try {
          // Step 1: Transcribe
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const { text } = await api.post<{ text: string }>("/voice/transcribe", formData);
          setSpokenText(text);

          // Step 2: Evaluate
          setState("evaluating");
          const result = await api.post<EvalResult>("/pronunciation/evaluate", {
            targetText: currentSentence.text,
            spokenText: text,
          });
          setEvalResult(result);
          setSessionScores((prev) => [...prev, result.score]);
          setState("result");
        } catch {
          setError("Có lỗi khi xử lý. Vui lòng thử lại.");
          setState("ready");
        }

        resolve();
      };

      recorder.stop();
    });
  }, [currentSentence]);

  // ─── Next sentence ───
  const nextSentence = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setEvalResult(null);
      setSpokenText("");
      setState("ready");
    } else {
      setState("idle"); // Session complete
    }
  }, [currentIdx, sentences.length]);

  // ─── Retry current sentence ───
  const retryCurrent = useCallback(() => {
    setEvalResult(null);
    setSpokenText("");
    setSessionScores((prev) => prev.slice(0, -1));
    setState("ready");
  }, []);

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0;

  const isSessionComplete = state === "idle" && sessionScores.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 24px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <AudioOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Luyện phát âm</h1>
          <Tag
            color={examMode === "toeic" ? "blue" : "purple"}
            style={{ marginLeft: "auto", borderRadius: 99 }}
          >
            {examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />} {modeLabel}
          </Tag>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Luyện phát âm tiếng Anh với AI đánh giá chi tiết
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "var(--error-bg, #fff2f0)",
              color: "var(--error, #ff4d4f)",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Session Complete Summary */}
        {isSessionComplete && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--card-bg)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {avgScore >= 80 ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : avgScore >= 50 ? (
                <InfoCircleOutlined style={{ color: "#faad14" }} />
              ) : (
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
              )}
            </div>
            <h2 style={{ margin: "0 0 8px" }}>Phiên luyện tập hoàn thành!</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px" }}>
              Điểm trung bình: <strong style={{ fontSize: 24, color: "var(--accent)" }}>{avgScore}</strong>/100
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {sessionScores.map((s, i) => (
                <Tag
                  key={i}
                  color={s >= 80 ? "success" : s >= 50 ? "warning" : "error"}
                  style={{ fontSize: 13, padding: "3px 10px" }}
                >
                  Câu {i + 1}: {s}
                </Tag>
              ))}
            </div>
            <button
              onClick={startPractice}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ReloadOutlined /> Luyện tiếp
            </button>
          </div>
        )}

        {/* Idle: Start */}
        {state === "idle" && !isSessionComplete && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--card-bg)",
            }}
          >
            <AudioOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px" }}>Sẵn sàng luyện phát âm?</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
              Chọn cấp độ và bắt đầu. AI sẽ đánh giá phát âm của bạn.
            </p>

            {/* Level selector */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              {[
                { value: "beginner", label: "Cơ bản" },
                { value: "intermediate", label: "Trung cấp" },
                { value: "advanced", label: "Nâng cao" },
              ].map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: level === l.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: level === l.value ? "var(--accent-muted)" : "transparent",
                    color: level === l.value ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: level === l.value ? 600 : 400,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={startPractice}
              style={{
                padding: "12px 32px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Bắt đầu luyện tập
            </button>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
            <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo bài tập...</p>
          </div>
        )}

        {/* Ready / Recording / Processing */}
        {currentSentence && (state === "ready" || state === "recording" || state === "transcribing" || state === "evaluating") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Progress indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>Câu {currentIdx + 1}/{sentences.length}</span>
              <Progress
                percent={((currentIdx + 1) / sentences.length) * 100}
                size="small"
                showInfo={false}
                style={{ flex: 1 }}
              />
            </div>

            {/* Sentence card */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: state === "recording" ? "2px solid #ff4d4f" : "1px solid var(--border)",
                background: "var(--card-bg)",
                textAlign: "center",
                animation: state === "recording" ? "pulse 1.5s ease-in-out infinite" : undefined,
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.5 }}>
                {currentSentence.text}
              </p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px", fontFamily: "serif" }}>
                {currentSentence.ipa}
              </p>

              {/* Listen button */}
              <button
                onClick={speakSentence}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <SoundOutlined /> Nghe mẫu
              </button>

              {/* Tip */}
              <Tooltip title={currentSentence.tip}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0", cursor: "help" }}>
                  <InfoCircleOutlined /> Gợi ý phát âm
                </p>
              </Tooltip>
            </div>

            {/* Record button */}
            <div style={{ textAlign: "center" }}>
              {state === "ready" && (
                <button
                  onClick={startRecording}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "none",
                    background: "linear-gradient(135deg, #ff4d4f, #ff7875)",
                    color: "#fff",
                    fontSize: 28,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(255,77,79,0.3)",
                    transition: "transform 0.2s",
                  }}
                  aria-label="Bắt đầu ghi âm"
                >
                  <AudioOutlined />
                </button>
              )}

              {state === "recording" && (
                <button
                  onClick={stopRecording}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "3px solid #ff4d4f",
                    background: "var(--card-bg)",
                    color: "#ff4d4f",
                    fontSize: 20,
                    cursor: "pointer",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                  aria-label="Dừng ghi âm"
                >
                  <BorderOutlined />
                </button>
              )}

              {(state === "transcribing" || state === "evaluating") && (
                <div>
                  <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                    {state === "transcribing" ? "Đang nhận dạng..." : "Đang đánh giá..."}
                  </p>
                </div>
              )}

              {state === "ready" && (
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                  Nhấn nút để ghi âm
                </p>
              )}
              {state === "recording" && (
                <p style={{ fontSize: 12, color: "#ff4d4f", marginTop: 8, fontWeight: 600 }}>
                  Đang ghi âm... Nhấn để dừng
                </p>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {state === "result" && evalResult && currentSentence && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <Progress
                type="circle"
                percent={evalResult.score}
                size={100}
                strokeColor={evalResult.score >= 80 ? "#52c41a" : evalResult.score >= 50 ? "#faad14" : "#ff4d4f"}
                format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}</span>}
              />
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Chính xác</p>
                  <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{evalResult.accuracy}%</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Trôi chảy</p>
                  <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{evalResult.fluency}%</p>
                </div>
              </div>
            </div>

            {/* What you said */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>
                Bạn đã nói:
              </p>
              <p style={{ fontSize: 15, margin: 0, fontStyle: "italic" }}>&ldquo;{spokenText}&rdquo;</p>
            </div>

            {/* Word analysis */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                Phân tích từng từ:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {evalResult.wordAnalysis.map((w, i) => (
                  <Tooltip key={i} title={w.issue || "Chính xác!"}>
                    <Tag
                      color={w.correct ? "success" : "error"}
                      style={{ fontSize: 13, padding: "3px 8px", cursor: "help" }}
                    >
                      {w.correct ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {w.word}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: 13, margin: "0 0 8px" }}>{evalResult.feedback}</p>
              {evalResult.tips.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)" }}>
                  {evalResult.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={retryCurrent}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <ReloadOutlined /> Thử lại
              </button>
              <button
                onClick={nextSentence}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {currentIdx < sentences.length - 1 ? (
                  <>Câu tiếp <RightOutlined /></>
                ) : (
                  <>Hoàn thành <CheckCircleOutlined /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
