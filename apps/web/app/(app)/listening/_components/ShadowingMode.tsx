"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";

import { Progress, Tag, Tooltip } from "antd";

import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import {
  ChevronRight,
  CircleCheckBig,
  Info,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
  XCircle,
} from "lucide-react";

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
    <div className="w-[600px] mx-auto w-full" >
      {error && (
        <div className="py-2.5 px-4 rounded-lg text-destructive mb-4 text-[13px]" style={{background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)"}} >
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle ── */}
      {state === "idle" && (
        <div className="text-center p-8 border-2 border-border rounded-2xl" style={{background: "var(--card-bg)"}} >
          <Volume2 size={48} className="text-accent" />
          <h2 className="mb-2 text-lg" >Shadowing</h2>
          <p className="text-text-secondary mb-2 text-[13px]" >
            Nghe → Lặp lại → So sánh phát âm
          </p>
          <p className="text-text-secondary text-xs" style={{margin: "0 0 24px"}} >
            5 câu mỗi phiên · AI đánh giá chi tiết · +25 XP
          </p>
          <button onClick={startSession} className="border-none text-[15px] font-semibold cursor-pointer" style={{padding: "12px 32px", borderRadius: 10, background: "var(--accent)", color: "var(--text-on-accent)"}} >
            Bắt đầu Shadowing
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {state === "loading" && (
        <div className="text-center" style={{padding: 40}} >
          <Loader2 className="animate-spin text-accent" size={32} />
          <p className="text-text-secondary mt-3" >Đang tạo bài tập...</p>
        </div>
      )}

      {/* ── Active: Ready / Recording / Processing ── */}
      {currentSentence && ["ready", "recording", "transcribing", "evaluating"].includes(state) && (
        <div className="flex flex-col gap-5" >
          {/* Progress */}
          <div className="flex items-center gap-2 text-[13px] text-text-secondary" >
            <span>Câu {currentIdx + 1}/{sentences.length}</span>
            <Progress percent={((currentIdx + 1) / sentences.length) * 100} size="small" showInfo={false} className="flex-1" />
          </div>

          {/* Sentence card */}
          <div className="p-6 rounded-2xl text-center" style={{border: state === "recording" ? "2px solid var(--error)" : "1px solid var(--border)", background: "var(--card-bg)", animation: state === "recording" ? "pulse 1.5s ease-in-out infinite" : undefined}} >
            <p className="text-xl font-semibold mb-2 leading-normal" >{currentSentence.text}</p>
            <p className="text-sm text-text-secondary mb-3" style={{fontFamily: "serif"}} >{currentSentence.ipa}</p>
            <Tooltip title={currentSentence.tip}>
              <p className="text-xs text-text-secondary" style={{margin: "8px 0 0", cursor: "help"}} >
                <Info /> Gợi ý phát âm
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
            <div className="text-center text-xs text-text-muted" >
              <Loader2 className="animate-spin" /> Đang tạo âm thanh...
            </div>
          )}

          {/* Record button */}
          <div className="text-center" >
            {state === "ready" && (
              <>
                <button onClick={startRecording}  aria-label="Ghi âm" className="w-[80px] h-[80px] rounded-full border-none text-[28px] cursor-pointer" style={{background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 70%, white))", color: "var(--text-on-accent)", boxShadow: "0 4px 16px color-mix(in srgb, var(--error) 30%, transparent)"}} >
                  <Mic />
                </button>
                <p className="text-xs text-text-secondary mt-2" >Nhấn nút để ghi âm</p>
              </>
            )}
            {state === "recording" && (
              <>
                <button onClick={stopRecording}  aria-label="Dừng ghi âm" className="w-[80px] h-[80px] rounded-full text-destructive text-xl cursor-pointer" style={{border: "3px solid var(--error)", background: "var(--card-bg)", animation: "pulse 1s ease-in-out infinite"}} >
                  <Square />
                </button>
                <p className="text-xs text-destructive mt-2 font-semibold" >Đang ghi âm... Nhấn để dừng</p>
              </>
            )}
            {(state === "transcribing" || state === "evaluating") && (
              <div>
                <Loader2 className="animate-spin text-accent" size={32} />
                <p className="text-[13px] text-text-secondary mt-2" >
                  {state === "transcribing" ? "Đang nhận dạng..." : "Đang đánh giá..."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && evalResult && currentSentence && (
        <div className="flex flex-col gap-4" >
          {/* Score */}
          <div className="p-6 rounded-2xl border-2 border-border text-center" style={{background: "var(--card-bg)"}} >
            <Progress type="circle" percent={evalResult.score} size={100}
              strokeColor={evalResult.score >= 80 ? "var(--success)" : evalResult.score >= 50 ? "var(--warning)" : "var(--error)"}
              format={(pct) => <span className="text-3xl font-bold" >{pct}</span>}
            />
            <div className="flex justify-center gap-6 mt-4" >
              <div><p className="text-[11px] text-text-secondary m-0" >Chính xác</p><p className="text-lg font-semibold m-0" >{evalResult.accuracy}%</p></div>
              <div><p className="text-[11px] text-text-secondary m-0" >Trôi chảy</p><p className="text-lg font-semibold m-0" >{evalResult.fluency}%</p></div>
            </div>
          </div>

          {/* What you said */}
          <div className="p-4 rounded-xl border-2 border-border" style={{background: "var(--card-bg)"}} >
            <p className="text-xs text-text-secondary font-semibold" style={{margin: "0 0 4px"}} >Bạn đã nói:</p>
            <p className="text-[15px] m-0 italic" >&ldquo;{spokenText}&rdquo;</p>
          </div>

          {/* Word analysis */}
          <div className="p-4 rounded-xl border-2 border-border" style={{background: "var(--card-bg)"}} >
            <p className="text-xs text-text-secondary mb-2 font-semibold" >Phân tích từng từ:</p>
            <div className="flex flex-wrap gap-1.5" >
              {evalResult.wordAnalysis.map((w, i) => (
                <Tooltip key={i} title={w.issue || "Chính xác!"}>
                  <Tag color={w.correct ? "success" : "error"} className="text-[13px]" style={{padding: "3px 8px", cursor: "help"}} >
                    {w.correct ? <CircleCheckBig /> : <XCircle />} {w.word}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Feedback + tips */}
          <div className="p-4 rounded-xl border-2 border-border" style={{background: "var(--card-bg)"}} >
            <p className="text-[13px] mb-2" >{evalResult.feedback}</p>
            {evalResult.tips.length > 0 && (
              <ul className="m-0 text-[13px] text-text-secondary" style={{paddingLeft: 18}} >
                {evalResult.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center" >
            <button onClick={retryCurrent} className="rounded-lg border-2 border-border bg-transparent cursor-pointer text-[13px] font-medium" style={{padding: "10px 20px", color: "var(--text)"}} >
              <RefreshCw /> Thử lại
            </button>
            <button onClick={nextSentence} className="rounded-lg border-none cursor-pointer text-[13px] font-semibold" style={{padding: "10px 20px", background: "var(--accent)", color: "var(--text-on-accent)"}} >
              {currentIdx < sentences.length - 1 ? <>Câu tiếp <ChevronRight /></> : <>Hoàn thành <CircleCheckBig /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {state === "summary" && (
        <div className="text-center p-8 border-2 border-border rounded-2xl" style={{background: "var(--card-bg)"}} >
          <div className="mb-4" style={{fontSize: 48}} >
            {avgScore >= 80 ? <CircleCheckBig className="text-emerald-500" /> :
             avgScore >= 50 ? <Info style={{ color: "var(--warning)" }} /> :
             <XCircle className="text-destructive" />}
          </div>
          <h2 className="mb-2" >Shadowing hoàn thành!</h2>
          <p className="text-text-secondary mb-2" >
            Điểm trung bình: <strong className="text-accent text-3xl" >{avgScore}</strong>/100
          </p>
          {xpAwarded > 0 && (
            <p className="text-accent text-[13px] font-semibold mb-2" >+{xpAwarded} XP</p>
          )}
          {skillUpdate && (
            <p className="text-[13px] mb-4" style={{color: skillUpdate.levelUp ? "var(--success)" : "var(--text-secondary)"}} >
              {skillUpdate.levelUp ? `🎉 Trình độ nghe: ${skillUpdate.cefr}!` : `📊 Trình độ nghe: ${skillUpdate.cefr}`}
            </p>
          )}
          <div className="flex gap-2 justify-center flex-wrap mb-5" >
            {sessionScores.map((s, i) => (
              <Tag key={i} color={s >= 80 ? "success" : s >= 50 ? "warning" : "error"} className="text-[13px]" style={{padding: "3px 10px"}} >
                Câu {i + 1}: {s}
              </Tag>
            ))}
          </div>
          <button onClick={startSession} className="rounded-lg border-none text-sm font-semibold cursor-pointer" style={{padding: "10px 24px", background: "var(--accent)", color: "var(--text-on-accent)"}} >
            <RefreshCw /> Luyện tiếp
          </button>
        </div>
      )}
    </div>
  );
}
