"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";

import { Progress, Tag } from "antd";

import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import {
  ChevronRight,
  CircleCheckBig,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";

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
  correct: "var(--success)",
  wrong: "var(--error)",
  missing: "var(--warning)",
};

const STATUS_BG: Record<string, string> = {
  correct: "color-mix(in srgb, var(--success) 8%, transparent)",
  wrong: "color-mix(in srgb, var(--error) 8%, transparent)",
  missing: "color-mix(in srgb, var(--warning) 8%, transparent)",
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
    <div className="w-[600px] mx-auto w-full" >
      {error && (
        <div className="py-2.5 px-4 rounded-lg text-destructive mb-4 text-[13px]" style={{background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)"}} >
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle ── */}
      {state === "idle" && (
        <div className="text-center p-8 border border-(--border) rounded-2xl" style={{background: "var(--card-bg)"}} >
          <Pencil size={48} className="text-accent" />
          <h2 className="mb-2 text-lg" >Dictation</h2>
          <p className="text-text-secondary mb-2 text-[13px]" >
            Nghe → Gõ lại → Kiểm tra từng từ
          </p>
          <p className="text-text-secondary text-xs" style={{margin: "0 0 24px"}} >
            5 câu mỗi phiên · Tối đa 3 lần nghe lại · +25 XP
          </p>
          <button onClick={startSession} className="border-none text-[15px] font-semibold cursor-pointer" style={{padding: "12px 32px", borderRadius: 10, background: "var(--accent)", color: "var(--text-on-accent)"}} >
            Bắt đầu Dictation
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

      {/* ── Ready: Listen + Type ── */}
      {state === "ready" && currentSentence && (
        <div className="flex flex-col gap-5" >
          {/* Progress */}
          <div className="flex items-center gap-2 text-[13px] text-text-secondary" >
            <span>Câu {currentIdx + 1}/{sentences.length}</span>
            <Progress percent={((currentIdx + 1) / sentences.length) * 100} size="small" showInfo={false} className="flex-1" />
          </div>

          {/* Instruction */}
          <div className="p-4 rounded-xl text-center border border-(--border)" style={{background: "var(--card-bg)"}} >
            <p className="text-sm text-text-secondary m-0" >
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
            <div className="text-center" style={{padding: 20}} >
              <Loader2 className="animate-spin text-accent" size={24} />
              <p className="text-xs text-text-muted mt-2" >Đang tạo âm thanh...</p>
            </div>
          ) : null}

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Gõ lại câu bạn nghe được..."
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); checkAnswer(); } }} className="w-full h-[100px] p-4 rounded-xl border border-(--border) text-[15px] leading-relaxed" style={{background: "var(--card-bg, var(--surface))", resize: "vertical", color: "var(--text)", fontFamily: "inherit"}} />

          {/* Check button */}
          <button onClick={checkAnswer} disabled={!typedText.trim()} className="border-none text-[15px] font-semibold" style={{padding: "12px 24px", borderRadius: 10, background: typedText.trim() ? "var(--accent)" : "var(--border)", color: "var(--text-on-accent)", cursor: typedText.trim() ? "pointer" : "not-allowed"}} >
            Kiểm tra ✓
          </button>
        </div>
      )}

      {/* ── Checked: Show diff ── */}
      {state === "checked" && currentSentence && (
        <div className="flex flex-col gap-4" >
          {/* Score */}
          <div className="p-6 rounded-2xl border border-(--border) text-center" style={{background: "var(--card-bg)"}} >
            <Progress type="circle" percent={accuracy} size={100}
              strokeColor={accuracy >= 80 ? "var(--success)" : accuracy >= 50 ? "var(--warning)" : "var(--error)"}
              format={(pct) => <span className="text-3xl font-bold" >{pct}%</span>}
            />
            <p className="text-[13px] text-text-secondary mt-2" >
              {accuracy === 100 ? "Hoàn hảo! 🎉" : accuracy >= 80 ? "Rất tốt! 👏" : accuracy >= 50 ? "Khá tốt, cố lên! 💪" : "Cần luyện thêm 📝"}
            </p>
          </div>

          {/* Word diff */}
          <div className="p-4 rounded-xl border border-(--border)" style={{background: "var(--card-bg)"}} >
            <p className="text-xs text-text-secondary mb-2 font-semibold" >
              Phân tích từng từ:
            </p>
            <div className="flex flex-wrap gap-1.5" >
              {diff.map((w, i) => (
                <span key={i} className="inline-block py-1 px-2 rounded-md text-sm font-medium" style={{background: STATUS_BG[w.status], color: STATUS_COLORS[w.status], border: `1px solid ${STATUS_COLORS[w.status]}33`}} >
                  {w.status === "correct" && <CircleCheckBig className="mr-1 text-[11px]" />}
                  {w.status === "wrong" && <XCircle className="mr-1 text-[11px]" />}
                  {w.status === "missing" && <Info className="mr-1 text-[11px]" />}
                  {w.word}
                  {w.status === "wrong" && w.typed && (
                    <span className="text-[11px] ml-1" style={{opacity: 0.7}} >({w.typed})</span>
                  )}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-text-secondary" >
              <span><span style={{ color: STATUS_COLORS.correct }}>●</span> Đúng</span>
              <span><span style={{ color: STATUS_COLORS.wrong }}>●</span> Sai</span>
              <span><span style={{ color: STATUS_COLORS.missing }}>●</span> Thiếu</span>
            </div>
          </div>

          {/* Revealed original */}
          <div className="p-4 rounded-xl border border-(--border)" style={{background: "var(--card-bg)"}} >
            <p className="text-xs text-text-secondary font-semibold" style={{margin: "0 0 4px"}} >Câu gốc:</p>
            <p className="text-base font-semibold" style={{margin: "0 0 4px"}} >{currentSentence.text}</p>
            <p className="text-[13px] text-text-secondary mb-2" style={{fontFamily: "serif"}} >{currentSentence.ipa}</p>
            <p className="text-xs text-text-secondary m-0" >
              <Info className="mr-1" />{currentSentence.tip}
            </p>
          </div>

          {/* What you typed */}
          <div className="p-4 rounded-xl border border-(--border)" style={{background: "var(--card-bg)"}} >
            <p className="text-xs text-text-secondary font-semibold" style={{margin: "0 0 4px"}} >Bạn đã gõ:</p>
            <p className="text-[15px] m-0 italic" >&ldquo;{typedText}&rdquo;</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center" >
            <button onClick={retryCurrent} className="rounded-lg border border-(--border) bg-transparent cursor-pointer text-[13px] font-medium" style={{padding: "10px 20px", color: "var(--text)"}} >
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
        <div className="text-center p-8 border border-(--border) rounded-2xl" style={{background: "var(--card-bg)"}} >
          <div className="mb-4" style={{fontSize: 48}} >
            {avgScore >= 80 ? <CircleCheckBig className="text-emerald-500" /> :
             avgScore >= 50 ? <Info style={{ color: "var(--warning)" }} /> :
             <XCircle className="text-destructive" />}
          </div>
          <h2 className="mb-2" >Dictation hoàn thành!</h2>
          <p className="text-text-secondary mb-2" >
            Độ chính xác trung bình: <strong className="text-accent text-3xl" >{avgScore}%</strong>
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
                Câu {i + 1}: {s}%
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
