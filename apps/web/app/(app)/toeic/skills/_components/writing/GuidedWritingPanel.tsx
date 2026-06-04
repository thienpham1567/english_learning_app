"use client";

import {
  BookOpen,
  Check,
  CheckCircle,
  ClipboardList,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  PenSquare,
  PenTool,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";

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
    taskCompletion: CriterionResult;
    organization: CriterionResult;
    vocabulary: CriterionResult;
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

type ExampleResult = {
  example: string;
  taskType: string;
  wordCount: number;
  keyTechniques: string[];
  vocabularyHighlights: Array<{ term: string; explanation: string }>;
  structureNotes: string;
};

type TaskType = "sentence-picture" | "email-response" | "opinion-essay";
type GuidedState = "setup" | "loading-prompt" | "writing" | "scoring" | "result";

const TOEIC_TOPICS = [
  { key: "workplace", label: "Workplace", color: "var(--info)" },
  { key: "business", label: "Business", color: "var(--accent)" },
  { key: "technology", label: "Technology", color: "var(--success)" },
  { key: "travel-transport", label: "Travel & Transport", color: "var(--module-grammar)" },
  { key: "shopping-services", label: "Shopping & Services", color: "var(--fire)" },
  { key: "health-fitness", label: "Health & Fitness", color: "var(--module-writing)" },
  { key: "events-meetings", label: "Events & Meetings", color: "var(--warning)" },
  { key: "hiring-training", label: "Hiring & Training", color: "var(--module-reading)" },
];

const TASK_OPTIONS: { value: TaskType; label: string; desc: string }[] = [
  { value: "sentence-picture", label: "Q1–Q5", desc: "Sentence from Picture" },
  { value: "email-response", label: "Q6–Q7", desc: "Email Response" },
  { value: "opinion-essay", label: "Q8", desc: "Opinion Essay" },
];

const TASK_MIN_WORDS: Record<TaskType, number> = {
  "sentence-picture": 15,
  "email-response": 80,
  "opinion-essay": 150,
};

/* ── Circular Progress ──────────────────────────────────── */

function CircularProgress({
  percent,
  overallScore,
  maxScore,
  size = 100,
  strokeWidth = 8,
  color = "var(--accent)",
}: {
  percent: number;
  overallScore: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-border/15"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-ink leading-none">{overallScore}</span>
        <span className="text-[10px] text-text-muted font-bold mt-1">/{maxScore}</span>
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export function GuidedWritingPanel() {
  const maxScore = 5;

  const [state, setState] = useState<GuidedState>("setup");
  const [task, setTask] = useState<TaskType>("opinion-essay");
  const [category, setCategory] = useState<string | null>(null);
  const [guided, setGuided] = useState<GuidedPromptData | null>(null);
  const [essayText, setEssayText] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exampleResult, setExampleResult] = useState<ExampleResult | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const minWords = TASK_MIN_WORDS[task];

  /* ── Generate prompt ────────────────────── */

  const generatePrompt = useCallback(
    async (topicCategory?: string) => {
      setError(null);
      setState("loading-prompt");
      setExampleResult(null);

      try {
        const data = await api.post<GuidedPromptData>("/writing/guided-prompt", {
          exam: task,
          topicCategory: topicCategory ?? category,
        });
        setGuided(data);
        setCategory(data.topicCategory);
        setEssayText("");
        setScoreResult(null);
        setState("writing");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setState("setup");
      }
    },
    [task, category],
  );

  /* ── Generate Example ───────────────────── */

  const generateExample = useCallback(async () => {
    if (!guided) return;
    setLoadingExample(true);
    setError(null);

    try {
      const data = await api.post<ExampleResult>("/writing-practice/example", {
        category: task,
        prompt: guided.prompt,
      });
      setExampleResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate example");
    } finally {
      setLoadingExample(false);
    }
  }, [guided, task]);

  /* ── Insert vocab at cursor ─────────────── */

  const insertVocab = useCallback(
    (term: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = essayText.slice(0, start);
      const after = essayText.slice(end);
      const newText = `${before}${term}${after}`;
      setEssayText(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + term.length;
      });
    },
    [essayText],
  );

  /* ── Submit for scoring ─────────────────── */

  const submitForScoring = useCallback(async () => {
    if (wordCount < minWords || !guided) return;
    setError(null);
    setState("scoring");

    try {
      const data = await api.post<ScoreResult>("/writing/score", {
        text: essayText,
        exam: task,
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
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("writing");
    }
  }, [essayText, task, guided, wordCount, minWords]);

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
        <div className="p-3 rounded-xl bg-error-bg border-2 border-error text-xs text-error shadow-sm">
          {error}
        </div>
      )}

      {/* ═══ SETUP ═══ */}
      {state === "setup" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <span className="font-bold text-sm text-ink">Guided Writing</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Select TOEIC task type and topic — AI will generate the prompt, outline, and vocabulary
            bank for you.
          </p>

          {/* Task type selector */}
          <div>
            <p className="text-xs text-text-primary font-bold mb-2">TOEIC Task Type</p>
            <div className="flex gap-2 flex-wrap">
              {TASK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTask(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
                    task === opt.value
                      ? "border-accent bg-accent/15 text-accent font-bold"
                      : "border-border bg-surface text-text-secondary hover:border-border hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span className="font-extrabold">{opt.label}</span>
                  <span className="ml-1.5 text-text-muted">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category selector */}
          <div>
            <p className="text-xs text-text-primary font-bold mb-2">
              Topic <span className="font-normal text-text-muted">(leave blank = random)</span>
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2">
              {TOEIC_TOPICS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(category === cat.key ? null : cat.key)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all duration-150 active:scale-97 block"
                  style={{
                    borderColor: category === cat.key ? cat.color : "var(--border)",
                    backgroundColor:
                      category === cat.key
                        ? `color-mix(in srgb, ${cat.color} 15%, transparent)`
                        : "var(--surface)",
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
            className="px-8 py-3 rounded-xl border-2 border-border bg-accent hover:bg-accent-hover text-text-on-accent text-xs font-bold flex items-center gap-1.5 self-center cursor-pointer shadow-sm active:scale-95 transition-all mt-2"
          >
            <Target className="h-4 w-4" />
            <span>Generate Prompt</span>
          </button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {state === "loading-prompt" && (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-9 w-9 text-accent animate-spin" />
          <p className="text-xs text-text-secondary mt-4 font-bold">
            Generating prompt and vocabulary...
          </p>
        </div>
      )}

      {/* ═══ WRITING ═══ */}
      {(state === "writing" || state === "scoring") && guided && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Prompt */}
          <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
            <div className="flex justify-between items-center mb-2.5">
              <p className="text-xs text-text-primary m-0 font-bold flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-accent" />
                <span>Prompt</span>
                <span className="text-text-muted font-normal">
                  ({TASK_OPTIONS.find((o) => o.value === task)?.label})
                </span>
              </p>
              <div className="flex gap-3">
                {/* Generate Example */}
                <button
                  type="button"
                  onClick={generateExample}
                  disabled={loadingExample}
                  className="border-none bg-transparent cursor-pointer text-accent hover:text-accent-hover text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingExample ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>Generate Example</span>
                </button>
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={() => generatePrompt(category ?? undefined)}
                  className="border-none bg-transparent cursor-pointer text-text-muted hover:text-text-primary text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Change Prompt</span>
                </button>
                {/* New category */}
                <button
                  type="button"
                  onClick={() => {
                    setState("setup");
                    setGuided(null);
                    setExampleResult(null);
                  }}
                  className="border-none bg-transparent cursor-pointer text-text-muted hover:text-text-primary text-xs font-semibold"
                >
                  Other Topics
                </button>
              </div>
            </div>
            <p className="text-sm m-0 leading-relaxed text-ink font-medium">{guided.prompt}</p>
          </div>

          {/* AI Example (if generated) */}
          {exampleResult && (
            <div className="p-4.5 rounded-2xl bg-success-bg border-2 border-success/30 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-4 w-4 text-success" />
                <span className="text-xs text-success font-bold">
                  AI Model Answer ({exampleResult.wordCount} words)
                </span>
              </div>
              <p className="text-sm m-0 leading-relaxed text-ink whitespace-pre-wrap">
                {exampleResult.example}
              </p>

              {/* Key techniques */}
              {exampleResult.keyTechniques.length > 0 && (
                <div className="mt-3 pt-3 border-t border-success/20">
                  <p className="text-[10px] text-success font-bold uppercase tracking-wider mb-1.5">
                    Key Techniques
                  </p>
                  <ul className="m-0 pl-4 text-xs text-text-secondary leading-relaxed list-disc flex flex-col gap-0.5">
                    {exampleResult.keyTechniques.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vocabulary highlights */}
              {exampleResult.vocabularyHighlights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-success/20">
                  <p className="text-[10px] text-success font-bold uppercase tracking-wider mb-1.5">
                    Vocabulary Highlights
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exampleResult.vocabularyHighlights.map((v, i) => (
                      <span
                        key={i}
                        className="relative group inline-block"
                      >
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-success/10 text-success border border-success/20 cursor-help">
                          {v.term}
                        </span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-foreground border-2 border-border text-background p-2 rounded-xl shadow-sm text-[11px] w-44 pointer-events-none text-center">
                          {v.explanation}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Structure notes */}
              {exampleResult.structureNotes && (
                <div className="mt-3 pt-3 border-t border-success/20">
                  <p className="text-[10px] text-success font-bold uppercase tracking-wider mb-1">
                    Structure
                  </p>
                  <p className="text-xs text-text-secondary m-0 leading-relaxed">
                    {exampleResult.structureNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Outline + Vocab — side by side */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {/* Outline */}
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-xs text-text-primary m-0 mb-2.5 font-bold flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-accent" />
                <span>Suggested Outline</span>
              </p>
              <ol className="m-0 pl-4.5 text-xs text-text-secondary leading-relaxed list-decimal flex flex-col gap-1">
                {guided.outline.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>

            {/* Vocab Bank */}
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-xs text-text-primary m-0 mb-3 font-bold flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-accent" />
                <span>Vocabulary Bank</span>
                <span className="font-normal text-text-muted">(click to insert)</span>
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
                            ? "border-success/30 bg-success-bg text-success font-bold"
                            : "border-border bg-bg-deep text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        }`}
                      >
                        {isUsed && <CheckCircle className="h-3 w-3 shrink-0 text-success" />}
                        <span>{v.term}</span>
                      </button>

                      {/* Tooltip Content */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-foreground border-2 border-border text-background p-2.5 rounded-xl shadow-sm text-[11px] w-52 pointer-events-none text-center">
                        <div className="font-bold text-background">{v.meaning}</div>
                        <div className="text-[10px] text-background/80 mt-1 font-medium italic">
                          {v.example}
                        </div>
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
              <p className="text-xs text-text-primary m-0 font-bold">Writing</p>
              <span
                className={`text-[10px] font-semibold ${
                  wordCount < minWords ? "text-error" : "text-text-muted"
                }`}
              >
                {wordCount} words {wordCount < minWords && `(needs ≥ ${minWords})`}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Write your response here. Click vocabulary items above to insert..."
              disabled={state === "scoring"}
              className="w-full min-h-70 p-4 rounded-2xl border-2 border-border bg-surface text-ink text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-accent/30 font-body disabled:opacity-60"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={submitForScoring}
            disabled={wordCount < minWords || state === "scoring"}
            className={`px-8 py-3 rounded-xl border-2 border-border text-xs font-bold flex items-center gap-1.5 self-center cursor-pointer transition-all duration-155 active:scale-97 shadow-sm ${
              wordCount < minWords || state === "scoring"
                ? "bg-bg-deep text-text-muted cursor-not-allowed border-2 border-border/20"
                : "bg-accent hover:bg-accent-hover text-text-on-accent"
            }`}
          >
            {state === "scoring" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scoring...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit & Score</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ RESULT ═══ */}
      {state === "result" && scoreResult && guided && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Overall score */}
          <div className="p-6 rounded-2xl bg-surface border-2 border-border text-center flex flex-col items-center shadow-xs">
            <CircularProgress
              percent={(scoreResult.overall / maxScore) * 100}
              overallScore={scoreResult.overall}
              maxScore={maxScore}
              color={scoreColor(scoreResult.overall)}
            />
            <p className="text-xs text-text-secondary m-0 mt-3 font-semibold">
              TOEIC Writing • {TASK_OPTIONS.find((o) => o.value === task)?.desc} •{" "}
              {scoreResult.wordCount} words
            </p>

            {/* Criteria scores */}
            <div className="flex justify-center gap-6 mt-5 flex-wrap w-full border-t-2 border-border pt-4">
              {(
                [
                  { key: "taskCompletion", label: "Task" },
                  { key: "organization", label: "Organization" },
                  { key: "vocabulary", label: "Vocabulary" },
                  { key: "grammar", label: "Grammar" },
                ] as const
              ).map((c) => {
                const s = scoreResult.criteria[c.key];
                return (
                  <div
                    key={c.key}
                    className="relative group inline-block cursor-pointer flex-1 min-w-[70px]"
                  >
                    <p className="text-[10px] text-text-muted m-0 font-bold uppercase tracking-wider">
                      {c.label}
                    </p>
                    <p
                      className="text-base font-extrabold m-0 mt-1 font-display"
                      style={{ color: scoreColor(s.score) }}
                    >
                      {s.score}
                    </p>

                    {/* Tooltip Content */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-foreground border-2 border-border text-background p-2.5 rounded-xl shadow-sm text-[11px] w-48 pointer-events-none text-center">
                      {s.feedback}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vocab usage summary */}
          <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
            <p className="text-xs text-text-primary m-0 mb-2.5 font-bold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-accent" />
              <span>Vocabulary Used</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {guided.vocabBank.map((v, i) => {
                const isUsed = essayText.toLowerCase().includes(v.term.toLowerCase());
                return (
                  <span
                    key={i}
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase border inline-flex items-center gap-1 ${
                      isUsed
                        ? "bg-success-bg border-success/20 text-success"
                        : "bg-bg-deep border-border/20 text-text-muted"
                    }`}
                  >
                    {isUsed ? (
                      <Check className="h-3 w-3 shrink-0" />
                    ) : (
                      <X className="h-3 w-3 shrink-0" />
                    )}
                    <span>{v.term}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Criteria feedback */}
          {(
            [
              {
                key: "taskCompletion",
                label: (
                  <>
                    <PenTool className="h-4 w-4" /> Task Completion
                  </>
                ),
              },
              {
                key: "organization",
                label: (
                  <>
                    <LinkIcon className="h-4 w-4" /> Organization
                  </>
                ),
              },
              {
                key: "vocabulary",
                label: (
                  <>
                    <BookOpen className="h-4 w-4" /> Vocabulary
                  </>
                ),
              },
              {
                key: "grammar",
                label: (
                  <>
                    <PenSquare className="h-4 w-4" /> Grammar
                  </>
                ),
              },
            ] as const
          ).map((c) => {
            const s = scoreResult.criteria[c.key];
            return (
              <div key={c.key} className="p-4.5 rounded-2xl bg-surface border-2 border-border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-text-primary m-0 font-bold flex items-center gap-1.5">
                    {c.label}
                  </p>
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider text-black border-2 border-border/10"
                    style={{ backgroundColor: scoreColor(s.score) }}
                  >
                    {s.score}/{maxScore}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed m-0">{s.feedback}</p>
              </div>
            );
          })}

          {/* Strengths & Next Steps */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-xs text-text-primary m-0 mb-2 font-bold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Strengths</span>
              </p>
              <ul className="m-0 pl-4.5 text-xs text-text-secondary leading-relaxed flex flex-col gap-1 list-disc">
                {scoreResult.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-xs text-text-primary m-0 mb-2 font-bold flex items-center gap-1.5">
                <Target className="h-4 w-4 text-accent" />
                <span>Areas for Improvement</span>
              </p>
              <ul className="m-0 pl-4.5 text-xs text-text-secondary leading-relaxed flex flex-col gap-1 list-disc">
                {scoreResult.nextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setState("setup");
                setGuided(null);
                setEssayText("");
                setScoreResult(null);
                setExampleResult(null);
              }}
              className="px-6 py-2.5 rounded-xl border-2 border-border bg-accent hover:bg-accent-hover text-text-on-accent text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-97"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>New Prompt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
