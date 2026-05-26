"use client";

import { useState, useCallback, useRef } from "react";
import {
  Lightbulb,
  Loader2,
  RefreshCw,
  Send,
  BookOpen,
  CheckCircle,
  PenTool,
  Target,
  Link as LinkIcon,
  PenSquare,
} from "lucide-react";;

import { api } from "@/lib/api-client";
import { useExamMode } from "@/components/shared/ExamModeProvider";

/* ── Types ──────────────────────────────────────────────── */

type VocabBankItem = {
  term: string;
  meaning: string;
  example: string;
};

type GuidedPromptData = {
  prompt: string;
  outline: string[];
  vocabBank: VocabBankItem[];
  topicCategory: string;
};

type CriterionResult = { score: number; feedback: string };

type ScoreResult = {
  overall: number;
  criteria: {
    taskResponse: CriterionResult;
    coherence: CriterionResult;
    lexical: CriterionResult;
    grammar: CriterionResult;
  };
  inlineIssues: Array<{
    quote: string;
    startOffset: number;
    endOffset: number;
    category: string;
    suggestion: string;
    explanation: string;
  }>;
  strengths: string[];
  nextSteps: string[];
  wordCount: number;
};

type ExamType = "ielts-task2" | "ielts-task1" | "toefl-independent";
type GuidedState = "setup" | "loading-prompt" | "writing" | "scoring" | "result";

const TOPIC_CATEGORIES = [
  { key: "education", label: "Giáo dục", color: "var(--info)" },
  { key: "technology", label: "Công nghệ", color: "var(--accent)" },
  { key: "environment", label: "Môi trường", color: "var(--success)" },
  { key: "health", label: "Sức khỏe", color: "var(--module-grammar)" },
  { key: "society", label: "Xã hội", color: "var(--fire)" },
  { key: "work", label: "Công việc", color: "var(--module-writing)" },
];

const EXAM_OPTIONS: { value: ExamType; label: string }[] = [
  { value: "ielts-task2", label: "IELTS Task 2" },
  { value: "ielts-task1", label: "IELTS Task 1" },
  { value: "toefl-independent", label: "TOEFL Independent" },
];

/* ── Circular Progress ──────────────────────────────────── */

function CircularProgress({ percent, overallScore, maxScore, size = 100, strokeWidth = 8, color = "var(--accent)" }: { percent: number; overallScore: number; maxScore: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-slate-850" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx={size / 2} cy={size / 2} r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset }} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" className="transition-all duration-500 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-ink leading-none">{overallScore}</span>
        <span className="text-[10px] text-slate-450 font-bold mt-1">/{maxScore}</span>
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export function GuidedWritingPanel() {
  const { examMode } = useExamMode();

  const [state, setState] = useState<GuidedState>("setup");
  const [exam, setExam] = useState<ExamType>(
    (examMode as string) === "toefl" ? "toefl-independent" : "ielts-task2",
  );
  const [category, setCategory] = useState<string | null>(null);
  const [guided, setGuided] = useState<GuidedPromptData | null>(null);
  const [essayText, setEssayText] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const isIelts = exam.startsWith("ielts");
  const maxScore = isIelts ? 9 : 30;

  /* ── Generate prompt ────────────────────── */

  const generatePrompt = useCallback(async (topicCategory?: string) => {
    setError(null);
    setState("loading-prompt");

    try {
      const data = await api.post<GuidedPromptData>("/writing/guided-prompt", {
        exam,
        topicCategory: topicCategory ?? category,
      });
      setGuided(data);
      setCategory(data.topicCategory);
      setEssayText("");
      setScoreResult(null);
      setState("writing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setState("setup");
    }
  }, [exam, category]); // exam included to avoid stale closure

  /* ── Insert vocab at cursor ─────────────── */

  const insertVocab = useCallback((term: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = essayText.slice(0, start);
    const after = essayText.slice(end);
    const newText = `${before}${term}${after}`;
    setEssayText(newText);
    // Restore cursor after insert
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + term.length;
    });
  }, [essayText]);

  /* ── Submit for scoring ─────────────────── */

  const submitForScoring = useCallback(async () => {
    if (wordCount < 150 || !guided) return;
    setError(null);
    setState("scoring");

    try {
      const data = await api.post<ScoreResult>("/writing/score", {
        text: essayText,
        exam,
        prompt: guided.prompt,
        vocabBank: guided.vocabBank,
        guidedPromptJson: {
          prompt: guided.prompt,
          outline: guided.outline,
          vocabBank: guided.vocabBank,
          topicCategory: guided.topicCategory,
        },
      });
      setScoreResult(data);
      setState("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setState("writing");
    }
  }, [essayText, exam, guided, wordCount]);

  /* ── Score color helper ─────────────────── */

  const scoreColor = (s: number) => {
    const pct = s / maxScore;
    return pct >= 0.75 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--error)";
  };

  /* ── Render ─────────────────────────────── */

  return (
    <div className="flex flex-col gap-4">
      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* ═══ SETUP ═══ */}
      {state === "setup" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <span className="font-bold text-sm text-ink">Viết có hướng dẫn</span>
          </div>
          <p className="text-xs text-slate-455 m-0 leading-relaxed">
            Chọn loại bài thi và chủ đề — AI sẽ tạo đề bài, dàn ý, và ngân hàng từ vựng cho bạn.
          </p>

          {/* Exam selector */}
          <div>
            <p className="text-xs text-slate-455 font-bold mb-2">Loại bài thi</p>
            <div className="flex gap-2 flex-wrap">
              {EXAM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExam(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
                    exam === opt.value
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-slate-400 hover:border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category selector (AC4) */}
          <div>
            <p className="text-xs text-slate-455 font-bold mb-2">
              Chủ đề <span className="font-normal text-slate-500">(bỏ trống = ngẫu nhiên)</span>
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2">
              {TOPIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(category === cat.key ? null : cat.key)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all duration-150 active:scale-97 block"
                  style={{
                    borderColor: category === cat.key ? cat.color : "var(--border)",
                    backgroundColor: category === cat.key ? `color-mix(in srgb, ${cat.color} 15%, transparent)` : "var(--surface)",
                    color: category === cat.key ? cat.color : "var(--text-secondary)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => generatePrompt()}
            className="px-8 py-3 rounded-xl border-none bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center gap-1.5 self-center cursor-pointer shadow-sm active:scale-95 transition-all mt-2"
          >
            <Target className="h-4 w-4" />
            <span>Tạo đề bài</span>
          </button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {state === "loading-prompt" && (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-9 w-9 text-accent animate-spin" />
          <p className="text-xs text-slate-455 mt-4 font-bold">
            Đang tạo đề bài và từ vựng...
          </p>
        </div>
      )}

      {/* ═══ WRITING ═══ */}
      {(state === "writing" || state === "scoring") && guided && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Prompt */}
          <div className="p-4.5 rounded-2xl bg-surface border border-border">
            <div className="flex justify-between items-center mb-2.5">
              <p className="text-xs text-slate-455 m-0 font-bold flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-accent" />
                <span>Đề bài</span>
              </p>
              <div className="flex gap-3">
                {/* Shuffle (AC4) */}
                <button
                  type="button"
                  onClick={() => generatePrompt(category ?? undefined)}
                  className="border-none bg-transparent cursor-pointer text-slate-455 hover:text-slate-200 text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Đổi đề</span>
                </button>
                {/* New category (AC4) */}
                <button
                  type="button"
                  onClick={() => { setState("setup"); setGuided(null); }}
                  className="border-none bg-transparent cursor-pointer text-slate-455 hover:text-slate-200 text-xs font-semibold"
                >
                  Chủ đề khác
                </button>
              </div>
            </div>
            <p className="text-sm m-0 leading-relaxed text-ink font-medium">{guided.prompt}</p>
          </div>

          {/* Outline + Vocab — side by side */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {/* Outline */}
            <div className="p-4.5 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-slate-455 m-0 mb-2.5 font-bold flex items-center gap-1.5">
                📋 Dàn ý gợi ý
              </p>
              <ol className="m-0 pl-4.5 text-xs text-slate-350 leading-relaxed list-decimal flex flex-col gap-1">
                {guided.outline.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>

            {/* Vocab Bank */}
            <div className="p-4.5 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-slate-455 m-0 mb-3 font-bold flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-accent" />
                <span>Ngân hàng từ vựng</span>
                <span className="font-normal text-slate-500">(click để chèn)</span>
              </p>
              <div className="flex flex-col gap-2">
                {guided.vocabBank.map((v, i) => {
                  const isUsed = essayText.toLowerCase().includes(v.term.toLowerCase());
                  return (
                    <div key={i} className="relative group inline-block w-full">
                      <button
                        type="button"
                        onClick={() => insertVocab(v.term)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-left w-full transition-all duration-150 border cursor-pointer active:scale-97 ${
                          isUsed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-455 font-bold"
                            : "border-border bg-slate-900/40 text-slate-300 hover:border-slate-800"
                        }`}
                      >
                        {isUsed && <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />}
                        <span>{v.term}</span>
                      </button>
                      
                      {/* Tooltip Content */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-slate-950 border border-slate-850 p-2.5 rounded-xl shadow-xl text-[11px] text-slate-300 w-52 pointer-events-none text-center">
                        <div className="font-bold text-slate-100">{v.meaning}</div>
                        <div className="text-[10px] text-slate-455 mt-1 font-medium italic">{v.example}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Essay textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-slate-455 m-0 font-bold">Bài viết</p>
              <span className={`text-[10px] font-semibold ${
                wordCount < 150 ? "text-red-400" : "text-slate-455"
              }`}>
                {wordCount} từ {wordCount < 150 && "(cần ≥ 150)"}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Viết bài viết của bạn ở đây. Click vào từ vựng bên phải để chèn..."
              disabled={state === "scoring"}
              className="w-full min-h-[280px] p-4 rounded-2xl border border-border bg-surface text-ink text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-accent/30 font-body disabled:opacity-60"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={submitForScoring}
            disabled={wordCount < 150 || state === "scoring"}
            className={`px-8 py-3 rounded-xl border-none text-xs font-bold text-white flex items-center gap-1.5 self-center cursor-pointer transition-all duration-155 active:scale-97 ${
              wordCount < 150 || state === "scoring"
                ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-border"
                : "bg-accent hover:bg-accent-hover shadow-sm"
            }`}
          >
            {state === "scoring" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang chấm bài...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Nộp bài & chấm điểm</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ RESULT ═══ */}
      {state === "result" && scoreResult && guided && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Overall score */}
          <div className="p-6 rounded-2xl bg-surface border border-border text-center flex flex-col items-center shadow-xs">
            <CircularProgress percent={(scoreResult.overall / maxScore) * 100} overallScore={scoreResult.overall} maxScore={maxScore} color={scoreColor(scoreResult.overall)} />
            <p className="text-xs text-slate-455 m-0 mt-3 font-semibold">
              {EXAM_OPTIONS.find((o) => o.value === exam)?.label} • {scoreResult.wordCount} từ
            </p>

            {/* Criteria scores */}
            <div className="flex justify-center gap-6 mt-5 flex-wrap w-full border-t border-border pt-4">
              {([
                { key: "taskResponse", label: "Task" },
                { key: "coherence", label: "Coherence" },
                { key: "lexical", label: "Lexical" },
                { key: "grammar", label: "Grammar" },
              ] as const).map((c) => {
                const s = scoreResult.criteria[c.key];
                return (
                  <div key={c.key} className="relative group inline-block cursor-pointer flex-1 min-w-[70px]">
                    <p className="text-[10px] text-slate-450 m-0 font-bold uppercase tracking-wider">{c.label}</p>
                    <p
                      className="text-base font-extrabold m-0 mt-1 font-display"
                      style={{ color: scoreColor(s.score) }}
                    >
                      {s.score}
                    </p>
                    
                    {/* Tooltip Content */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-slate-950 border border-slate-850 p-2.5 rounded-xl shadow-xl text-[11px] text-slate-300 w-48 pointer-events-none text-center">
                      {s.feedback}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vocab usage summary */}
          <div className="p-4.5 rounded-2xl bg-surface border border-border">
            <p className="text-xs text-slate-455 m-0 mb-2.5 font-bold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-accent" />
              <span>Từ vựng đã sử dụng</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {guided.vocabBank.map((v, i) => {
                const isUsed = essayText.toLowerCase().includes(v.term.toLowerCase());
                return (
                  <span
                    key={i}
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase border ${
                      isUsed
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                        : "bg-slate-900 border-slate-850 text-slate-450"
                    }`}
                  >
                    {isUsed ? "✓" : "✗"} {v.term}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Criteria feedback */}
          {([
            { key: "taskResponse", label: <><PenTool className="h-4 w-4" /> Task Response</> },
            { key: "coherence", label: <><LinkIcon className="h-4 w-4" /> Coherence &amp; Cohesion</> },
            { key: "lexical", label: <><BookOpen className="h-4 w-4" /> Lexical Resource</> },
            { key: "grammar", label: <><PenSquare className="h-4 w-4" /> Grammar</> },
          ] as const).map((c) => {
            const s = scoreResult.criteria[c.key];
            return (
              <div key={c.key} className="p-4.5 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-slate-455 m-0 font-bold flex items-center gap-1.5">{c.label}</p>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-white"
                    style={{ backgroundColor: scoreColor(s.score) }}
                  >
                    {s.score}
                  </span>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed m-0">{s.feedback}</p>
              </div>
            );
          })}

          {/* Strengths & Next Steps */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <div className="p-4.5 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-slate-455 m-0 mb-2 font-bold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Điểm mạnh</span>
              </p>
              <ul className="m-0 pl-4.5 text-xs text-slate-350 leading-relaxed flex flex-col gap-1 list-disc">
                {scoreResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="p-4.5 rounded-2xl bg-surface border border-border">
              <p className="text-xs text-slate-455 m-0 mb-2 font-bold flex items-center gap-1.5">
                <Target className="h-4 w-4 text-accent" />
                <span>Cần cải thiện</span>
              </p>
              <ul className="m-0 pl-4.5 text-xs text-slate-350 leading-relaxed flex flex-col gap-1 list-disc">
                {scoreResult.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => { setState("setup"); setGuided(null); setEssayText(""); setScoreResult(null); }}
              className="px-6 py-2.5 rounded-xl border-none bg-accent hover:bg-accent-hover text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-97"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Bài mới</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
