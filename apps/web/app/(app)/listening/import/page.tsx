"use client";

import { useState, useCallback, useRef } from "react";
import {
  LinkOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";
import { api } from "@/lib/api-client";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";

// ── Types ──
type TranscriptSegment = { start: number; end: number; text: string };
type VocabItem = { term: string; partOfSpeech: string; meaning: string; example: string };
type QuizQuestion = { question: string; options: string[]; correctIndex: number };

type ImportResult = {
  id: string;
  title: string;
  durationSec: number;
  summary: string;
  segmentCount: number;
  vocabCount: number;
  questionCount: number;
};

type ImportDetail = {
  id: string;
  title: string;
  sourceUrl: string;
  durationSec: number;
  transcript: TranscriptSegment[];
  keyVocab: VocabItem[];
  quiz: QuizQuestion[];
  audioUrl: string;
  createdAt: string;
};

type ImportState = "idle" | "fetching" | "transcribing" | "analyzing" | "done" | "error";

const noop = () => true;
const noopVoid = () => {};

// ── Progress step descriptions ──
const STEPS: Record<string, { label: string; pct: number }> = {
  fetching:     { label: "Đang tải audio...",           pct: 25 },
  transcribing: { label: "Đang chuyển giọng nói → văn bản (Whisper)...", pct: 55 },
  analyzing:    { label: "Đang phân tích từ vựng & câu hỏi...", pct: 85 },
};

export default function ListeningImportPage() {
  const [state, setState] = useState<ImportState>("idle");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importData, setImportData] = useState<ImportDetail | null>(null);
  const [selectedTab, setSelectedTab] = useState<"transcript" | "vocab" | "quiz">("transcript");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Submit import ──
  const handleImport = useCallback(async () => {
    if (!url.trim()) return;
    setError(null);
    setImportData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);

    // Simulate progress stages (real progress is server-side)
    setState("fetching");

    // We advance the visual state on a timer since the actual request is a single POST
    const timer1 = setTimeout(() => setState("transcribing"), 5000);
    const timer2 = setTimeout(() => setState("analyzing"), 15000);

    try {
      const result = await api.post<ImportResult>("/listening/import", {
        url: url.trim(),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      // Load full detail
      const detail = await api.get<ImportDetail>(`/listening/import/${result.id}`);
      setImportData(detail);
      setState("done");
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      type ApiError = { response?: { data?: { error?: string } }; message?: string };
      const apiErr = err as ApiError;
      setError(apiErr?.response?.data?.error ?? apiErr?.message ?? "Import failed");
      setState("error");
    }
  }, [url]);

  const handleReset = useCallback(() => {
    setState("idle");
    setUrl("");
    setError(null);
    setImportData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setActiveSegmentIdx(-1);
  }, []);

  // Format seconds to mm:ss
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          background: "var(--surface)",
        }}
      >
        <a href="/listening" style={{ color: "var(--text-muted)", fontSize: 16 }}>
          <ArrowLeftOutlined />
        </a>
        <LinkOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            Import Podcast / YouTube
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Dán URL → Whisper chuyển thành bài nghe + từ vựng + quiz
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Error banner ── */}
          {error && (
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)", color: "var(--error)", fontSize: 13 }}>
              <WarningOutlined style={{ marginRight: 6 }} /> {error}
            </div>
          )}

          {/* ── Idle: URL input ── */}
          {(state === "idle" || state === "error") && (
            <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <PlayCircleOutlined style={{ fontSize: 40, color: "var(--accent)", marginBottom: 12 }} />
                <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Import Audio</h2>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
                  Dán link YouTube hoặc URL file audio (mp3/m4a) để tạo bài nghe
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImport()}
                  placeholder="https://youtube.com/watch?v=... hoặc URL mp3"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 14,
                    color: "var(--text)",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleImport}
                  disabled={!url.trim()}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: url.trim() ? "var(--accent)" : "var(--border)",
                    color: "var(--text-on-accent, #fff)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: url.trim() ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap",
                  }}
                >
                  Import
                </button>
              </div>

              {/* Legal note (AC6) */}
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Nội dung nhập chỉ dùng cho mục đích luyện tập cá nhân, không được phân phối lại.
                Audio chỉ phát cho tài khoản của bạn.
              </p>

              {/* Supported sources */}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {["YouTube", "MP3", "M4A", "WAV"].map((s) => (
                  <Tag key={s} color="default" style={{ fontSize: 11 }}>{s}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* ── Progress ── */}
          {(state === "fetching" || state === "transcribing" || state === "analyzing") && (
            <div style={{ padding: 32, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", textAlign: "center" }}>
              <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)", marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--text)" }}>
                {STEPS[state]?.label ?? "Processing..."}
              </p>
              <Progress
                percent={STEPS[state]?.pct ?? 50}
                status="active"
                strokeColor="var(--accent)"
                style={{ maxWidth: 400, margin: "0 auto" }}
              />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
                Quá trình này có thể mất 15–60 giây tùy độ dài audio
              </p>
            </div>
          )}

          {/* ── Done: full exercise view ── */}
          {state === "done" && importData && (
            <>
              {/* Title + metadata */}
              <div style={{ padding: 20, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 20 }} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{importData.title}</h2>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span>⏱ {fmtTime(importData.durationSec)}</span>
                  <span>📝 {importData.transcript.length} đoạn</span>
                  <span>📚 {importData.keyVocab.length} từ vựng</span>
                  <span>❓ {importData.quiz.length} câu hỏi</span>
                </div>
              </div>

              {/* Audio player */}
              <AudioPlayer
                audioUrl={importData.audioUrl}
                speed={1}
                replaysUsed={0}
                maxReplays={999}
                onReplay={noop}
                onCycleSpeed={noopVoid}
                selfManagedSpeed
              />

              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
                {([
                  { key: "transcript", label: "Transcript", icon: <FileTextOutlined /> },
                  { key: "vocab", label: "Từ vựng", icon: <BookOutlined /> },
                  { key: "quiz", label: "Quiz", icon: <QuestionCircleOutlined /> },
                ] as const).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTab(key)}
                    style={{
                      flex: 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: selectedTab === key ? "var(--accent)" : "transparent",
                      color: selectedTab === key ? "var(--text-on-accent, #fff)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Tab: Transcript scrubber */}
              {selectedTab === "transcript" && (
                <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)", maxHeight: 400, overflow: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {importData.transcript.map((seg, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveSegmentIdx(i)}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "6px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: activeSegmentIdx === i ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, marginTop: 2, minWidth: 42 }}>
                          {fmtTime(seg.start)}
                        </span>
                        <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>
                          {seg.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Vocabulary panel */}
              {selectedTab === "vocab" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {importData.keyVocab.map((v, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{v.term}</span>
                        <Tag color="blue" style={{ fontSize: 10 }}>{v.partOfSpeech}</Tag>
                      </div>
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-secondary)" }}>{v.meaning}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>"{v.example}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Quiz */}
              {selectedTab === "quiz" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {importData.quiz.map((q, qi) => {
                    const userAnswer = quizAnswers[qi];
                    const isCorrect = quizSubmitted && userAnswer === q.correctIndex;
                    const isWrong = quizSubmitted && userAnswer !== undefined && userAnswer !== q.correctIndex;

                    return (
                      <div key={qi} style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: `1px solid ${quizSubmitted ? (isCorrect ? "color-mix(in srgb, var(--success) 25%, transparent)" : isWrong ? "color-mix(in srgb, var(--error) 25%, transparent)" : "var(--border)") : "var(--border)"}` }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>
                          {qi + 1}. {q.question}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {q.options.map((opt, oi) => {
                            const isSelected = userAnswer === oi;
                            const showCorrect = quizSubmitted && oi === q.correctIndex;
                            const showWrong = quizSubmitted && isSelected && oi !== q.correctIndex;

                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [qi]: oi }))}
                                disabled={quizSubmitted}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: 8,
                                  border: `1px solid ${showCorrect ? "var(--success)" : showWrong ? "var(--error)" : isSelected ? "var(--accent)" : "var(--border)"}`,
                                  background: showCorrect ? "color-mix(in srgb, var(--success) 6%, var(--surface))" : showWrong ? "color-mix(in srgb, var(--error) 6%, var(--surface))" : isSelected ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface)",
                                  fontSize: 13,
                                  textAlign: "left",
                                  cursor: quizSubmitted ? "default" : "pointer",
                                  color: "var(--text)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                {showCorrect && <CheckCircleOutlined style={{ color: "var(--success)" }} />}
                                {showWrong && <CloseCircleOutlined style={{ color: "var(--error)" }} />}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quiz submit/results */}
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < importData.quiz.length}
                      style={{
                        padding: "12px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: Object.keys(quizAnswers).length >= importData.quiz.length ? "var(--accent)" : "var(--border)",
                        color: "var(--text-on-accent, #fff)",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: Object.keys(quizAnswers).length >= importData.quiz.length ? "pointer" : "not-allowed",
                      }}
                    >
                      Kiểm tra
                    </button>
                  ) : (
                    <div style={{ textAlign: "center", padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>
                        Kết quả: {importData.quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length}/{importData.quiz.length}
                      </p>
                      <button
                        onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 12, marginTop: 8 }}
                      >
                        Làm lại
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={handleReset}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "var(--text-on-accent, #fff)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Import bài khác
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
