"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";

import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";

type Sentence = { text: string; ipa: string; tip: string };

type DiffWord = {
  word: string;
  typed?: string;
  status: "correct" | "wrong" | "missing";
};

type DictationState = "idle" | "loading" | "ready" | "checked" | "summary";

interface Props {
  examMode: string;
}

const MAX_REPLAYS = 3;

const STATUS_COLORS: Record<string, string> = {
  correct: "#52c41a",
  wrong: "#ff4d4f",
  missing: "#faad14",
};

const STATUS_BG: Record<string, string> = {
  correct: "#52c41a15",
  wrong: "#ff4d4f15",
  missing: "#faad1415",
};

/** Normalize text for comparison: lowercase, strip punctuation */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compare target vs typed at word level */
function diffWords(target: string, typed: string): DiffWord[] {
  const targetWords = normalize(target).split(/\s+/).filter(Boolean);
  const typedWords = normalize(typed).split(/\s+/).filter(Boolean);

  return targetWords.map((word, i) => {
    if (i < typedWords.length && typedWords[i] === word) {
      return { word, status: "correct" };
    } else if (i < typedWords.length) {
      return { word, typed: typedWords[i], status: "wrong" };
    } else {
      return { word, status: "missing" };
    }
  });
}

export default function DictationMode({ examMode }: Props) {
  const [state, setState] = useState<DictationState>("idle");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [diff, setDiff] = useState<DiffWord[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [replaysUsed, setReplaysUsed] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skillUpdate, setSkillUpdate] = useState<{ cefr: string; levelUp: boolean } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentSentence = sentences[currentIdx] ?? null;

  // AudioPlayer integration (Story 19.3.2 — AC4 migration)
  const sentenceAudio = useSentenceAudio();

  // Synthesize audio when sentence changes
  useEffect(() => {
    if (currentSentence && state === "ready") {
      sentenceAudio.synthesize(currentSentence.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentSentence?.text]);

  // ── Generate sentences ──
  const startSession = useCallback(async () => {
    setState("loading");
    setError(null);
    setSessionScores([]);
    setCurrentIdx(0);
    setTypedText("");
    setDiff([]);
    setReplaysUsed(0);
    setSkillUpdate(null);
    setXpAwarded(0);
    sentenceAudio.clear();

    try {
      const data = await api.post<{ sentences: Sentence[] }>("/pronunciation/sentences", {
        level: "intermediate", count: 5, examMode,
      });
      if (!data.sentences?.length) throw new Error("No sentences");
      setSentences(data.sentences);
      setState("ready");
    } catch {
      setError("Không thể tạo bài tập. Vui lòng thử lại.");
      setState("idle");
    }
  }, [examMode, sentenceAudio]);

  // Replay handler for AudioPlayer — counts replays
  const handleReplay = useCallback(() => {
    if (replaysUsed >= MAX_REPLAYS) return false;
    setReplaysUsed((p) => p + 1);
    return true;
  }, [replaysUsed]);

  // Noop for speed — AudioPlayer manages speed internally
  const handleCycleSpeed = useCallback(() => {}, []);

  // ── Check answer ──
  const checkAnswer = useCallback(() => {
    if (!currentSentence || !typedText.trim()) return;
    const result = diffWords(currentSentence.text, typedText);
    const correctCount = result.filter((w) => w.status === "correct").length;
    const pct = Math.round((correctCount / result.length) * 100);
    setDiff(result);
    setAccuracy(pct);
    setSessionScores((prev) => [...prev, pct]);
    setState("checked");
  }, [currentSentence, typedText]);

  // ── Next sentence ──
  const nextSentence = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((p) => p + 1);
      setTypedText("");
      setDiff([]);
      setReplaysUsed(0);
      sentenceAudio.clear();
      setState("ready");
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      completeSession(sessionScores);
    }
  }, [currentIdx, sentences.length, sessionScores, sentenceAudio]);

  // ── Retry current sentence ──
  const retryCurrent = useCallback(() => {
    setTypedText("");
    setDiff([]);
    setSessionScores((prev) => prev.slice(0, -1));
    setReplaysUsed(0);
    setState("ready");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Complete session ──
  const completeSession = useCallback(async (finalScores: number[]) => {
    setState("loading");
    const scores = [...finalScores];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    try {
      const data = await api.post<{ xpAwarded: number; skillUpdate: { cefr: string; levelUp: boolean } }>("/dictation/complete", {
        scores, avgAccuracy: avg,
      });
      setXpAwarded(data.xpAwarded);
      setSkillUpdate(data.skillUpdate);
    } catch { /* continue to summary */ }
    setState("summary");
  }, []);

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 0;

  // ── RENDER ──
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "#ff4d4f15", border: "1px solid #ff4d4f40", color: "#ff4d4f", marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle ── */}
      {state === "idle" && (
        <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
          <EditOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Dictation</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 8px", fontSize: 13 }}>
            Nghe → Gõ lại → Kiểm tra từng từ
          </p>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 12 }}>
            5 câu mỗi phiên · Tối đa 3 lần nghe lại · +25 XP
          </p>
          <button onClick={startSession} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Bắt đầu Dictation
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {state === "loading" && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo bài tập...</p>
        </div>
      )}

      {/* ── Ready: Listen + Type ── */}
      {state === "ready" && currentSentence && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Câu {currentIdx + 1}/{sentences.length}</span>
            <Progress percent={((currentIdx + 1) / sentences.length) * 100} size="small" showInfo={false} style={{ flex: 1 }} />
          </div>

          {/* Instruction */}
          <div style={{
            padding: 16, borderRadius: 12, textAlign: "center",
            border: "1px solid var(--border)", background: "var(--card-bg)",
          }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              🎧 Nghe và gõ lại câu bạn nghe được
            </p>
          </div>

          {/* AudioPlayer — sentence playback (AC4 migration) */}
          {sentenceAudio.audioUrl ? (
            <AudioPlayer
              audioUrl={sentenceAudio.audioUrl}
              speed={1}
              replaysUsed={replaysUsed}
              maxReplays={MAX_REPLAYS}
              onReplay={handleReplay}
              onCycleSpeed={handleCycleSpeed}
              selfManagedSpeed
            />
          ) : sentenceAudio.isLoading ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <LoadingOutlined style={{ fontSize: 24, color: "var(--accent)" }} />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Đang tạo âm thanh...</p>
            </div>
          ) : null}

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Gõ lại câu bạn nghe được..."
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); checkAnswer(); } }}
            style={{
              width: "100%", minHeight: 100, padding: 16, borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--card-bg, var(--surface))",
              fontSize: 15, lineHeight: 1.6, resize: "vertical", color: "var(--text)",
              fontFamily: "inherit",
            }}
          />

          {/* Check button */}
          <button onClick={checkAnswer} disabled={!typedText.trim()} style={{
            padding: "12px 24px", borderRadius: 10, border: "none",
            background: typedText.trim() ? "var(--accent)" : "var(--border)",
            color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: typedText.trim() ? "pointer" : "not-allowed",
          }}>
            Kiểm tra ✓
          </button>
        </div>
      )}

      {/* ── Checked: Show diff ── */}
      {state === "checked" && currentSentence && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Score */}
          <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", textAlign: "center" }}>
            <Progress type="circle" percent={accuracy} size={100}
              strokeColor={accuracy >= 80 ? "#52c41a" : accuracy >= 50 ? "#faad14" : "#ff4d4f"}
              format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}%</span>}
            />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
              {accuracy === 100 ? "Hoàn hảo! 🎉" : accuracy >= 80 ? "Rất tốt! 👏" : accuracy >= 50 ? "Khá tốt, cố lên! 💪" : "Cần luyện thêm 📝"}
            </p>
          </div>

          {/* Word diff */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
              Phân tích từng từ:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {diff.map((w, i) => (
                <span key={i} style={{
                  display: "inline-block", padding: "4px 8px", borderRadius: 6,
                  background: STATUS_BG[w.status], color: STATUS_COLORS[w.status],
                  fontSize: 14, fontWeight: 500, border: `1px solid ${STATUS_COLORS[w.status]}33`,
                }}>
                  {w.status === "correct" && <CheckCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />}
                  {w.status === "wrong" && <CloseCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />}
                  {w.status === "missing" && <InfoCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />}
                  {w.word}
                  {w.status === "wrong" && w.typed && (
                    <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({w.typed})</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: "var(--text-secondary)" }}>
              <span><span style={{ color: STATUS_COLORS.correct }}>●</span> Đúng</span>
              <span><span style={{ color: STATUS_COLORS.wrong }}>●</span> Sai</span>
              <span><span style={{ color: STATUS_COLORS.missing }}>●</span> Thiếu</span>
            </div>
          </div>

          {/* Revealed original */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>Câu gốc:</p>
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{currentSentence.text}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px", fontFamily: "serif" }}>{currentSentence.ipa}</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />{currentSentence.tip}
            </p>
          </div>

          {/* What you typed */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>Bạn đã gõ:</p>
            <p style={{ fontSize: 15, margin: 0, fontStyle: "italic" }}>&ldquo;{typedText}&rdquo;</p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={retryCurrent} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              <ReloadOutlined /> Thử lại
            </button>
            <button onClick={nextSentence} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {currentIdx < sentences.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {state === "summary" && (
        <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {avgScore >= 80 ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> :
             avgScore >= 50 ? <InfoCircleOutlined style={{ color: "#faad14" }} /> :
             <CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
          </div>
          <h2 style={{ margin: "0 0 8px" }}>Dictation hoàn thành!</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Độ chính xác trung bình: <strong style={{ fontSize: 24, color: "var(--accent)" }}>{avgScore}%</strong>
          </p>
          {xpAwarded > 0 && (
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>+{xpAwarded} XP</p>
          )}
          {skillUpdate && (
            <p style={{ fontSize: 13, color: skillUpdate.levelUp ? "#52c41a" : "var(--text-secondary)", margin: "0 0 16px" }}>
              {skillUpdate.levelUp ? `🎉 Trình độ nghe: ${skillUpdate.cefr}!` : `📊 Trình độ nghe: ${skillUpdate.cefr}`}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            {sessionScores.map((s, i) => (
              <Tag key={i} color={s >= 80 ? "success" : s >= 50 ? "warning" : "error"} style={{ fontSize: 13, padding: "3px 10px" }}>
                Câu {i + 1}: {s}%
              </Tag>
            ))}
          </div>
          <button onClick={startSession} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <ReloadOutlined /> Luyện tiếp
          </button>
        </div>
      )}
    </div>
  );
}
