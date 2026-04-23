"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  AudioOutlined,
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  InfoCircleOutlined,
  BorderOutlined,
} from "@ant-design/icons";
import { Progress, Tag, Tooltip } from "antd";

import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";

type Sentence = { text: string; ipa: string; tip: string };
type WordAnalysis = { word: string; spoken: string; correct: boolean; issue?: string };
type EvalResult = {
  score: number; accuracy: number; fluency: number;
  feedback: string; wordAnalysis: WordAnalysis[]; tips: string[];
};

type ShadowState = "idle" | "loading" | "ready" | "recording" | "transcribing" | "evaluating" | "result" | "summary";

interface Props {
  examMode: string;
}

export default function ShadowingMode({ examMode }: Props) {
  const [state, setState] = useState<ShadowState>("idle");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [skillUpdate, setSkillUpdate] = useState<{ cefr: string; levelUp: boolean } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const currentSentence = sentences[currentIdx] ?? null;

  // AudioPlayer integration (Story 19.3.2 — AC4 migration)
  const sentenceAudio = useSentenceAudio();
  const [replaysUsed] = useState(0); // Shadowing has unlimited replays

  // Synthesize audio when sentence changes
  useEffect(() => {
    if (currentSentence && (state === "ready" || state === "recording")) {
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
    setEvalResult(null);
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

  // ── Recording ──
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ ghi âm.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      setState("recording");
    } catch {
      setError("Không thể truy cập microphone.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !currentSentence) return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("transcribing");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          const { text } = await api.post<{ text: string }>("/voice/transcribe", formData);
          setSpokenText(text);

          setState("evaluating");
          const result = await api.post<EvalResult>("/pronunciation/evaluate", {
            targetText: currentSentence.text, spokenText: text,
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

  // ── Next / Retry / Complete ──
  const nextSentence = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((p) => p + 1);
      setEvalResult(null);
      setSpokenText("");
      sentenceAudio.clear();
      setState("ready");
    } else {
      // Pass current scores to avoid stale closure (F1 fix)
      completeSession(sessionScores);
    }
  }, [currentIdx, sentences.length, sessionScores, sentenceAudio]);

  const retryCurrent = useCallback(() => {
    setEvalResult(null);
    setSpokenText("");
    setSessionScores((prev) => prev.slice(0, -1));
    setState("ready");
  }, []);

  const completeSession = useCallback(async (finalScores: number[]) => {
    setState("loading");
    const scores = [...finalScores];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    try {
      const data = await api.post<{ xpAwarded: number; skillUpdate: { cefr: string; levelUp: boolean } }>("/shadowing/complete", {
        scores, avgScore: avg,
      });
      setXpAwarded(data.xpAwarded);
      setSkillUpdate(data.skillUpdate);
    } catch { /* continue to summary anyway */ }
    setState("summary");
  }, []);

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 0;

  // Noop handlers for AudioPlayer compat (unlimited replays in Shadowing)
  const handleReplay = useCallback(() => true, []);
  const handleCycleSpeed = useCallback(() => {}, []);

  // ── RENDER ──
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)", color: "var(--error)", marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle ── */}
      {state === "idle" && (
        <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
          <SoundOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Shadowing</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 8px", fontSize: 13 }}>
            Nghe → Lặp lại → So sánh phát âm
          </p>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 12 }}>
            5 câu mỗi phiên · AI đánh giá chi tiết · +25 XP
          </p>
          <button onClick={startSession} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Bắt đầu Shadowing
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

      {/* ── Active: Ready / Recording / Processing ── */}
      {currentSentence && ["ready", "recording", "transcribing", "evaluating"].includes(state) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Câu {currentIdx + 1}/{sentences.length}</span>
            <Progress percent={((currentIdx + 1) / sentences.length) * 100} size="small" showInfo={false} style={{ flex: 1 }} />
          </div>

          {/* Sentence card */}
          <div style={{
            padding: 24, borderRadius: 16, textAlign: "center",
            border: state === "recording" ? "2px solid var(--error)" : "1px solid var(--border)",
            background: "var(--card-bg)",
            animation: state === "recording" ? "pulse 1.5s ease-in-out infinite" : undefined,
          }}>
            <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.5 }}>{currentSentence.text}</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px", fontFamily: "serif" }}>{currentSentence.ipa}</p>
            <Tooltip title={currentSentence.tip}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0", cursor: "help" }}>
                <InfoCircleOutlined /> Gợi ý phát âm
              </p>
            </Tooltip>
          </div>

          {/* AudioPlayer — model sentence playback (AC4 migration) */}
          {sentenceAudio.audioUrl && (
            <AudioPlayer
              audioUrl={sentenceAudio.audioUrl}
              speed={1}
              replaysUsed={replaysUsed}
              maxReplays={999}
              onReplay={handleReplay}
              onCycleSpeed={handleCycleSpeed}
              selfManagedSpeed
            />
          )}
          {sentenceAudio.isLoading && (
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              <LoadingOutlined /> Đang tạo âm thanh...
            </div>
          )}

          {/* Record button */}
          <div style={{ textAlign: "center" }}>
            {state === "ready" && (
              <>
                <button onClick={startRecording} style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 70%, white))", color: "var(--text-on-accent, #fff)", fontSize: 28, cursor: "pointer", boxShadow: "0 4px 16px color-mix(in srgb, var(--error) 30%, transparent)" }} aria-label="Ghi âm">
                  <AudioOutlined />
                </button>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>Nhấn nút để ghi âm</p>
              </>
            )}
            {state === "recording" && (
              <>
                <button onClick={stopRecording} style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid var(--error)", background: "var(--card-bg)", color: "var(--error)", fontSize: 20, cursor: "pointer", animation: "pulse 1s ease-in-out infinite" }} aria-label="Dừng ghi âm">
                  <BorderOutlined />
                </button>
                <p style={{ fontSize: 12, color: "var(--error)", marginTop: 8, fontWeight: 600 }}>Đang ghi âm... Nhấn để dừng</p>
              </>
            )}
            {(state === "transcribing" || state === "evaluating") && (
              <div>
                <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                  {state === "transcribing" ? "Đang nhận dạng..." : "Đang đánh giá..."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && evalResult && currentSentence && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Score */}
          <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", textAlign: "center" }}>
            <Progress type="circle" percent={evalResult.score} size={100}
              strokeColor={evalResult.score >= 80 ? "var(--success)" : evalResult.score >= 50 ? "var(--warning)" : "var(--error)"}
              format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}</span>}
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
              <div><p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Chính xác</p><p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{evalResult.accuracy}%</p></div>
              <div><p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Trôi chảy</p><p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{evalResult.fluency}%</p></div>
            </div>
          </div>

          {/* What you said */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>Bạn đã nói:</p>
            <p style={{ fontSize: 15, margin: 0, fontStyle: "italic" }}>&ldquo;{spokenText}&rdquo;</p>
          </div>

          {/* Word analysis */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>Phân tích từng từ:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {evalResult.wordAnalysis.map((w, i) => (
                <Tooltip key={i} title={w.issue || "Chính xác!"}>
                  <Tag color={w.correct ? "success" : "error"} style={{ fontSize: 13, padding: "3px 8px", cursor: "help" }}>
                    {w.correct ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {w.word}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Feedback + tips */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, margin: "0 0 8px" }}>{evalResult.feedback}</p>
            {evalResult.tips.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)" }}>
                {evalResult.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={retryCurrent} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              <ReloadOutlined /> Thử lại
            </button>
            <button onClick={nextSentence} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "var(--text-on-accent, #fff)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {currentIdx < sentences.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {state === "summary" && (
        <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {avgScore >= 80 ? <CheckCircleOutlined style={{ color: "var(--success)" }} /> :
             avgScore >= 50 ? <InfoCircleOutlined style={{ color: "var(--warning)" }} /> :
             <CloseCircleOutlined style={{ color: "var(--error)" }} />}
          </div>
          <h2 style={{ margin: "0 0 8px" }}>Shadowing hoàn thành!</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Điểm trung bình: <strong style={{ fontSize: 24, color: "var(--accent)" }}>{avgScore}</strong>/100
          </p>
          {xpAwarded > 0 && (
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>+{xpAwarded} XP</p>
          )}
          {skillUpdate && (
            <p style={{ fontSize: 13, color: skillUpdate.levelUp ? "var(--success)" : "var(--text-secondary)", margin: "0 0 16px" }}>
              {skillUpdate.levelUp ? `🎉 Trình độ nghe: ${skillUpdate.cefr}!` : `📊 Trình độ nghe: ${skillUpdate.cefr}`}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            {sessionScores.map((s, i) => (
              <Tag key={i} color={s >= 80 ? "success" : s >= 50 ? "warning" : "error"} style={{ fontSize: 13, padding: "3px 10px" }}>
                Câu {i + 1}: {s}
              </Tag>
            ))}
          </div>
          <button onClick={startSession} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <ReloadOutlined /> Luyện tiếp
          </button>
        </div>
      )}
    </div>
  );
}
