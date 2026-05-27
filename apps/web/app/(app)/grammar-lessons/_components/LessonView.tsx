"use client";


import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  ChevronRight,
  CircleCheckBig,
  Eye,
  Flame,
  Languages,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Star,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import {
  type GrammarLessonAnswer,
  type GrammarLessonData,
  type GrammarLessonProgressItem,
  isGrammarAnswerCorrect,
} from "@/lib/grammar-lessons/schema";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  recognition: { label: "Recognition", color: "blue" },
  application: { label: "Application", color: "cyan" },
  production: { label: "Production", color: "purple" },
  context: { label: "Context", color: "volcano" },
};

type LessonState = "loading" | "lesson" | "exercises" | "complete";

type CompleteResponse = {
  xpAwarded: number;
  alreadyCompleted: boolean;
  loggedErrors: number;
  progress: GrammarLessonProgressItem;
};

interface Props {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  onBack: () => void;
  onComplete: (topicId: string, progress: GrammarLessonProgressItem) => void;
}

export function LessonView({ topicId, topicTitle, level, examMode, onBack, onComplete }: Props) {
  const router = useRouter();
  const [state, setState] = useState<LessonState>("loading");
  const [lesson, setLesson] = useState<GrammarLessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<GrammarLessonAnswer[]>([]);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [loggedErrors, setLoggedErrors] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [explLang, setExplLang] = useState<"vi" | "en">("vi");
  const [showReview, setShowReview] = useState(false);
  const { speak: speakTts, isSpeaking, isLoading: isTtsLoading } = useTextToSpeech();

  const loadLesson = useCallback(
    async (forceRefresh = false) => {
      return api.post<GrammarLessonData>("/grammar-lessons/generate", {
        topic: topicId,
        topicTitle,
        examMode,
        level,
        forceRefresh,
      });
    },
    [examMode, level, topicId, topicTitle],
  );

  const generateLesson = useCallback(
    async (forceRefresh = true) => {
      setState("loading");
      setError(null);
      try {
        const data = await loadLesson(forceRefresh);
        setLesson(data);
        setState("lesson");
      } catch {
        setError("Failed to generate lesson. Please try again.");
        setState("lesson");
      }
    },
    [loadLesson],
  );

  // Auto-generate on mount
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await loadLesson();
        if (!cancelled) {
          setLesson(data);
          setError(null);
          setState("lesson");
        }
      } catch {
        if (!cancelled) {
          setError("Failed to generate lesson. Please try again.");
          setState("lesson");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadLesson]);

  const currentExercise = lesson?.exercises?.[exerciseIdx] ?? null;

  const resetExerciseInput = () => {
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
    setHintUsed(false);
    setExplLang("vi");
  };

  const recordAnswer = (userAnswer: string, correct: boolean) => {
    if (revealed || !currentExercise) return;

    setAnswers((prev) => [
      ...prev,
      {
        exerciseId: currentExercise.id,
        type: currentExercise.type,
        questionStem: currentExercise.sentence,
        options: currentExercise.type === "multiple_choice" ? currentExercise.options : undefined,
        userAnswer,
        correctAnswer: currentExercise.answer,
        explanationVi: currentExercise.explanation,
        explanationEn: currentExercise.explanationEn,
        correct,
      },
    ]);
    setRevealed(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
    }
  };

  const handleAnswer = (option: string) => {
    if (revealed || !currentExercise || currentExercise.type !== "multiple_choice") return;
    setSelected(option);
    recordAnswer(option, option === currentExercise.answer);
  };

  const handleWrittenAnswer = () => {
    if (!currentExercise || currentExercise.type === "multiple_choice") return;
    const userAnswer = typedAnswer.trim();
    if (!userAnswer) return;
    recordAnswer(
      userAnswer,
      isGrammarAnswerCorrect(userAnswer, currentExercise.answer, currentExercise.acceptedAnswers),
    );
  };

  const nextExercise = async () => {
    if (!lesson) return;
    if (exerciseIdx < lesson.exercises.length - 1) {
      setExerciseIdx((i) => i + 1);
      resetExerciseInput();
    } else {
      const completedAt = new Date().toISOString();
      const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
      const fallbackProgress: GrammarLessonProgressItem = {
        topicId,
        status: "completed",
        correctCount,
        totalCount: lesson.exercises.length,
        scorePct,
        completedAt,
        lastStudiedAt: completedAt,
      };
      try {
        const data = await api.post<CompleteResponse>("/grammar-lessons/complete", {
          topic: topicId,
          topicTitle,
          examMode,
          level,
          correctCount,
          totalCount: lesson.exercises.length,
          durationMs: startedAt ? Date.now() - startedAt : 0,
          answers,
        });
        setXpAwarded(data.xpAwarded);
        setLoggedErrors(data.loggedErrors);
        setAlreadyCompleted(data.alreadyCompleted);
        onComplete(topicId, data.progress);
      } catch {
        onComplete(topicId, fallbackProgress);
      }
      setState("complete");
    }
  };

  const speakText = (text: string) => {
    speakTts(text);
  };

  return (
    <div className="w-[700px] mx-auto w-full">
      {/* Back button */}
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="items-center gap-2 py-2 px-4 border-2 border-border rounded-lg bg-surface text-accent cursor-pointer text-[13px] font-bold mb-4"
        style={{ display: "inline-flex", boxShadow: "var(--shadow-sm)", transition: "all 0.15s" }}
      >
        <ArrowLeft /> Lesson List
      </m.button>

      {/* Loading state */}
      {state === "loading" && (
        <div
          className="text-center rounded-xl bg-surface border-2 border-border"
          style={{ padding: "72px 24px", boxShadow: "var(--shadow-md)" }}
        >
          <Loader2 className="animate-spin text-accent" size={38} />
          <p className="text-text-secondary mt-5 font-bold" style={{ fontSize: 14.5 }}>
            Generating lesson: <strong className="text-accent">{topicTitle}</strong>
          </p>
          <p className="text-text-muted m-0 font-medium" style={{ fontSize: 12.5 }}>
            AI is analyzing concepts and compiling practice questions...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="p-6 rounded-xl text-destructive text-center"
          style={{
            background: "var(--error-bg)",
            border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
          }}
        >
          <p className="font-bold text-sm">{error}</p>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generateLesson(false)}
            className="rounded-lg border-none cursor-pointer mt-3 font-extrabold"
            style={{
              padding: "9px 18px",
              background: "var(--error)",
              color: "var(--text-on-accent)",
            }}
          >
            Retry
          </m.button>
        </div>
      )}

      {/* Lesson content */}
      {state === "lesson" && lesson && (
        <div className="flex flex-col gap-4">
          {/* Title Card — Premium Hero */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border-2 border-border relative overflow-hidden"
            style={{
              padding: "28px 24px 24px",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Top accent gradient bar */}
            <div
              className="absolute w-full h-[3px]"
              style={{
                left: 0,
                top: 0,
                background:
                  "linear-gradient(90deg, var(--accent), var(--secondary), var(--success))",
              }}
            />
            {/* Decorative glow */}
            <div
              className="absolute w-[180px] h-[180px] rounded-full"
              style={{
                top: "-30%",
                right: "-10%",
                background: "color-mix(in srgb, var(--accent) 4%, transparent)",
                pointerEvents: "none",
              }}
            />

            <div className="flex items-start gap-3.5 relative">
              {/* Icon badge */}
              <div
                className="w-[46px] h-[46px] grid shrink-0"
                style={{
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 75%, var(--secondary)))",
                  placeItems: "center",
                  boxShadow: "0 4px 14px var(--accent-muted)",
                }}
              >
                <BookOpen size={20} className="text-[#fff]" />
              </div>
              <div className="flex-1">
                <h2
                  className="m-0 text-xl font-black text-text-primary font-display"
                  style={{ lineHeight: 1.3 }}
                >
                  {lesson.title}
                </h2>
                <p
                  className="text-sm text-text-secondary font-medium leading-normal"
                  style={{ margin: "4px 0 0" }}
                >
                  {lesson.titleVi}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0 items-center">
                <span
                  className="text-[11px] font-extrabold text-accent rounded-full"
                  style={{
                    background: "var(--accent-light)",
                    border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                    padding: "4px 12px",
                  }}
                >
                  {level}
                </span>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => generateLesson(true)}
                  className="border-2 border-border rounded-lg bg-surface text-text-secondary cursor-pointer text-xs py-1.5 px-3.5 font-bold"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <RefreshCw /> Regenerate
                </m.button>
              </div>
            </div>
          </m.div>

          {/* Formula Card — Glassmorphism */}
          {lesson.formula && (
            <m.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl text-center relative overflow-hidden"
              style={{
                padding: "22px 24px",
                background:
                  "linear-gradient(135deg, var(--accent-light), color-mix(in srgb, var(--secondary) 6%, var(--surface)))",
                border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 8%, transparent)",
              }}
            >
              {/* Decorative dots */}
              <div className="absolute flex" style={{ top: 8, right: 12, gap: 3, opacity: 0.3 }}>
                <div
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <div
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: "var(--secondary)" }}
                />
                <div
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: "var(--success)" }}
                />
              </div>
              <span className="text-[11px] text-accent font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 mb-2.5">
                <Calculator /> Core Structure
              </span>
              <p
                className="font-black text-accent m-0 font-mono"
                style={{ fontSize: 19, wordBreak: "break-all", letterSpacing: "0.02em" }}
              >
                {lesson.formula}
              </p>
            </m.div>
          )}

          {/* Explanation Card */}
          <div
            className="rounded-xl bg-surface border-2 border-border"
            style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
          >
            <span
              className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5 mb-3"
              style={{ fontSize: 11.5 }}
            >
              <BookOpen /> Theoretical Analysis
            </span>
            <p
              className="text-text-primary m-0 font-medium"
              style={{ fontSize: 14.5, lineHeight: 1.7 }}
            >
              {lesson.explanationEn ?? lesson.explanation}
            </p>
            <div
              className="py-3 px-4 rounded-lg bg-surface-alt"
              style={{ marginTop: 14, borderLeft: "3.5px solid var(--accent)" }}
            >
              <span className="font-extrabold text-accent" style={{ fontSize: 11.5 }}>
                📝 Explanation
              </span>
              <p
                className="text-text-secondary font-medium"
                style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.65 }}
              >
                {lesson.explanation}
              </p>
            </div>
          </div>

          {/* Usage Notes Card */}
          {lesson.usageNotes && lesson.usageNotes.length > 0 && (
            <div
              className="rounded-xl bg-surface border-2 border-border"
              style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, marginBottom: 14 }}
              >
                📌 Detailed Usage
              </span>
              <div className="flex flex-col gap-2.5">
                {lesson.usageNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-lg bg-surface-alt border-2 border-border items-start"
                    style={{ padding: "12px 14px" }}
                  >
                    <div
                      className="w-[26px] h-[26px] rounded-lg text-accent grid text-xs font-black shrink-0"
                      style={{ background: "var(--accent-light)", placeItems: "center" }}
                    >
                      {idx + 1}
                    </div>
                    <p
                      className="m-0 leading-relaxed text-text-primary font-medium"
                      style={{ fontSize: 13.5 }}
                    >
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOEIC Tips Card */}
          {lesson.toeicTips && lesson.toeicTips.length > 0 && (
            <div
              className="rounded-xl"
              style={{
                padding: 20,
                background:
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(239, 68, 68, 0.02))",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                className="font-extrabold uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, color: "var(--warning)", marginBottom: 14 }}
              >
                🎯 TOEIC Exam Tips — 900-Point Insight
              </span>
              <div className="flex flex-col gap-2">
                {lesson.toeicTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2.5 rounded-lg bg-surface border-2 border-border items-start"
                    style={{ padding: "12px 14px" }}
                  >
                    <span className="text-base shrink-0" style={{ marginTop: 1 }}>
                      💡
                    </span>
                    <p
                      className="m-0 leading-relaxed text-text-primary font-semibold"
                      style={{ fontSize: 13.5 }}
                    >
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Signals Card */}
          {lesson.timeSignals && lesson.timeSignals.length > 0 && (
            <div
              className="rounded-xl bg-surface border-2 border-border"
              style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, marginBottom: 14 }}
              >
                ⏰ Time Signals & Keywords
              </span>
              <div className="flex flex-wrap gap-2">
                {lesson.timeSignals.map((signal, idx) => (
                  <span
                    key={idx}
                    className="text-[13px] font-bold rounded-lg m-0 py-1 px-3.5 bg-[var(--info)] text-white border-2 border-border"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confusion Pairs Card */}
          {lesson.confusionPairs && lesson.confusionPairs.length > 0 && (
            <div
              className="rounded-xl bg-surface border-2 border-border"
              style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, marginBottom: 14 }}
              >
                ⚡ Commonly Confused Structures
              </span>
              <div className="flex flex-col gap-3">
                {lesson.confusionPairs.map((pair, idx) => (
                  <div
                     key={idx}
                     className="rounded-lg border-2 border-border overflow-hidden"
                  >
                    {/* Pair header */}
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(59, 130, 246, 0.06)",
                          borderRight: "1px solid var(--border)",
                        }}
                      >
                        <div
                          className="text-xs font-extrabold mb-1"
                          style={{ color: "var(--info)" }}
                        >
                          {pair.structureA}
                        </div>
                        <p
                          className="m-0 text-text-primary font-medium leading-normal italic"
                          style={{ fontSize: 12.5 }}
                        >
                          {pair.exampleA}
                        </p>
                      </div>
                      <div style={{ padding: "10px 14px", background: "rgba(139, 92, 246, 0.06)" }}>
                        <div className="text-xs font-extrabold text-accent mb-1">
                          {pair.structureB}
                        </div>
                        <p
                          className="m-0 text-text-primary font-medium leading-normal italic"
                          style={{ fontSize: 12.5 }}
                        >
                          {pair.exampleB}
                        </p>
                      </div>
                    </div>
                    {/* Difference explanation */}
                    <div
                      className="bg-surface-alt"
                      style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}
                    >
                      <p className="m-0 text-[13px] leading-relaxed text-text-secondary font-medium">
                        <Lightbulb style={{ color: "var(--warning)", marginRight: 6 }} />
                        {pair.difference}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples Card */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div
              className="rounded-xl bg-surface border-2 border-border"
              style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, marginBottom: 14 }}
              >
                <MessageSquare /> Illustrative Examples
              </span>
              <div className="flex flex-col gap-2.5">
                {lesson.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-surface-alt border-2 border-border"
                    style={{ padding: 14 }}
                  >
                    <div className="flex items-start gap-2.5">
                      <p
                        className="font-bold m-0 flex-1 text-text-primary leading-normal"
                        style={{ fontSize: 14.5 }}
                      >
                        {ex.en.split(ex.highlight).map((part, j, arr) => (
                          <span key={j}>
                            {part}
                            {j < arr.length - 1 && (
                              <strong
                                className="text-accent"
                                style={{ borderBottom: "1.5px solid var(--accent)" }}
                              >
                                {ex.highlight}
                              </strong>
                            )}
                          </span>
                        ))}
                      </p>
                      <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => speakText(ex.en)}
                        disabled={isSpeaking || isTtsLoading}
                        className="border-none bg-surface rounded-lg w-[28px] h-[28px] grid text-accent"
                        style={{
                          placeItems: "center",
                          cursor: isSpeaking || isTtsLoading ? "not-allowed" : "pointer",
                          boxShadow: "var(--shadow-sm)",
                          opacity: isSpeaking || isTtsLoading ? 0.5 : 1,
                        }}
                      >
                        {isTtsLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
                      </m.button>
                    </div>
                    <p
                      className="text-[13px] text-text-muted font-semibold"
                      style={{ margin: "6px 0 0" }}
                    >
                      {ex.vi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes Card */}
          {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
            <div
              className="rounded-xl bg-surface border-2 border-border"
              style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontSize: 11.5, marginBottom: 14 }}
              >
                <AlertTriangle style={{ color: "var(--warning)" }} /> Common Pitfalls & Mistakes
              </span>
              {lesson.commonMistakes.map((mItem, idx) => (
                <div
                  key={idx}
                  className="rounded-lg"
                  style={{
                    padding: 14,
                    background: "rgba(239, 68, 68, 0.03)",
                    border: "1px solid color-mix(in srgb, var(--error) 15%, var(--border))",
                    marginBottom: idx < lesson.commonMistakes.length - 1 ? 10 : 0,
                  }}
                >
                  <div
                    className="flex items-start gap-1.5 font-bold text-destructive"
                    style={{ fontSize: 13.5 }}
                  >
                    <XCircle style={{ marginTop: 3 }} />
                    <span style={{ textDecoration: "line-through" }}>{mItem.wrong}</span>
                  </div>
                  <div
                    className="flex items-start gap-1.5 font-bold text-emerald-500 mt-1.5"
                    style={{ fontSize: 13.5 }}
                  >
                    <CircleCheckBig style={{ marginTop: 3 }} />
                    <span>{mItem.correct}</span>
                  </div>

                  {mItem.noteEn && (
                    <div
                      className="mt-2.5 text-text-primary font-medium flex items-start gap-1.5"
                      style={{ fontSize: 12.5 }}
                    >
                      <Languages className="text-accent" style={{ marginTop: 3 }} />
                      <span>{mItem.noteEn}</span>
                    </div>
                  )}

                  <div
                    className="mt-1.5 text-text-muted font-medium flex items-start gap-1.5"
                    style={{ fontSize: 12.5 }}
                  >
                    <Lightbulb style={{ color: "var(--warning)", marginTop: 3 }} />
                    <span>{mItem.note}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Exercises Button — Premium CTA */}
          <m.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setState("exercises");
              setExerciseIdx(0);
              setCorrectCount(0);
              setCombo(0);
              setAnswers([]);
              setStartedAt(Date.now());
              resetExerciseInput();
            }}
            className="rounded-xl border-none text-base font-black cursor-pointer text-center w-full flex items-center justify-center gap-2.5 relative overflow-hidden font-display"
            style={{
              padding: "18px 24px",
              background:
                "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))",
              color: "var(--text-on-accent)",
              boxShadow: "0 8px 28px var(--accent-muted)",
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute w-[120px] h-[120px] rounded-full"
              style={{
                top: "-50%",
                right: "-10%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }}
            />
            <div
              className="absolute w-[80px] h-[80px] rounded-full"
              style={{
                bottom: "-40%",
                left: "5%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
              }}
            />
            <span className="relative">🚀 Start Practice — {lesson.exercises.length} questions</span>
            <ChevronRight className="relative text-sm" />
          </m.button>
        </div>
      )}

      {/* Exercises Mode */}
      {state === "exercises" && lesson && currentExercise && (
        <div className="flex flex-col gap-4">
          {/* Header Progress */}
          <div className="flex flex-col gap-1.5">
            <div
              className="flex justify-between font-bold text-text-secondary"
              style={{ justifySelf: "stretch", fontSize: 12.5 }}
            >
              <span>
                Question {exerciseIdx + 1} of {lesson.exercises.length}
              </span>
              <span className="text-accent">
                {Math.round(((exerciseIdx + 1) / lesson.exercises.length) * 100)}%
              </span>
            </div>

            <div
              className="h-[6px] rounded-full relative overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${((exerciseIdx + 1) / lesson.exercises.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className="absolute rounded-full"
                style={{
                  left: 0,
                  top: 0,
                  bottom: 0,
                  background: "linear-gradient(90deg, var(--accent), var(--xp))",
                }}
              />
            </div>
          </div>

          {/* Combo badge */}
          {combo >= 2 && (
            <m.div
              key={`combo-${combo}`}
              initial={{ scale: 0.5, y: -10 }}
              animate={{ scale: [1, 1.1, 1], y: 0 }}
              className="flex justify-center"
            >
              <span
                className="items-center gap-1.5 rounded-full text-sm font-black"
                style={{
                  display: "inline-flex",
                  background: "linear-gradient(135deg, var(--fire), var(--xp))",
                  padding: "6px 18px",
                  color: "var(--text-on-accent)",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                }}
              >
                <Flame /> {combo} COMBO! 🔥
              </span>
            </m.div>
          )}

          {/* Main Question Box */}
          <div
            className="p-6 rounded-xl bg-surface border-2 border-border relative"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div
              className="absolute w-[4px]"
              style={{
                left: 0,
                top: 0,
                bottom: 0,
                background: "var(--accent)",
                borderRadius: "4px 0 0 4px",
              }}
            />

            {/* Tags */}
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <span
                className="text-[10.5px] font-extrabold text-accent rounded-md"
                style={{ background: "var(--accent-light)", padding: "2px 8px" }}
              >
                {currentExercise.type === "multiple_choice"
                  ? "Multiple Choice"
                  : currentExercise.type === "error_correction"
                    ? "Error Correction"
                    : "Sentence Rewriting"}
              </span>

              {currentExercise.tier && TIER_LABELS[currentExercise.tier] && (
                <span
                  className="text-[10.5px] font-extrabold rounded-md"
                  style={{
                    color: `var(--${TIER_LABELS[currentExercise.tier].color})`,
                    background: `color-mix(in srgb, var(--${TIER_LABELS[currentExercise.tier].color}) 8%, transparent)`,
                    padding: "2px 8px",
                  }}
                >
                  {TIER_LABELS[currentExercise.tier].label}
                </span>
              )}
            </div>

            {/* Question sentence */}
            <p
              className="font-bold leading-relaxed mb-4 text-text-primary"
              style={{ fontSize: 16.5 }}
            >
              {currentExercise.sentence}
            </p>

            {/* Hint toggler */}
            {currentExercise.hint && !revealed && !hintUsed && (
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHintUsed(true)}
                className="items-center gap-1.5 py-1.5 px-3 text-xs font-bold cursor-pointer mb-4"
                style={{
                  display: "inline-flex",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid color-mix(in srgb, var(--warning) 30%, var(--border))",
                  background: "rgba(245, 158, 11, 0.05)",
                  color: "var(--warning)",
                }}
              >
                <Eye /> View Hint
              </m.button>
            )}

            {hintUsed && currentExercise.hint && !revealed && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg mb-4 text-[13px] text-text-secondary font-medium"
                style={{
                  padding: "10px 14px",
                  background: "rgba(245, 158, 11, 0.05)",
                  border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
                }}
              >
                <Lightbulb style={{ color: "var(--warning)", marginRight: 6 }} />
                {currentExercise.hint}
              </m.div>
            )}

            {/* MCQs Option items */}
            {currentExercise.type === "multiple_choice" ? (
              <div className="flex flex-col gap-2">
                {currentExercise.options.map((opt, idx) => {
                  const isCorrect = opt === currentExercise.answer;
                  const isSelected = opt === selected;
                  let bg = "var(--surface)";
                  let border = "1.5px solid var(--border)";
                  let color = "var(--text-primary)";
                  let opacity = 1;

                  if (revealed) {
                    if (isCorrect) {
                      bg = "rgba(16, 185, 129, 0.08)";
                      border = "1.5px solid var(--success)";
                      color = "var(--success)";
                    } else if (isSelected) {
                      bg = "rgba(239, 68, 68, 0.08)";
                      border = "1.5px solid var(--error)";
                      color = "var(--error)";
                    } else {
                      opacity = 0.4;
                    }
                  } else if (isSelected) {
                    bg = "var(--accent-light)";
                    border = "1.5px solid var(--accent)";
                    color = "var(--accent)";
                  }

                  return (
                    <m.button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={revealed}
                      whileHover={revealed ? {} : { scale: 1.005, x: 2 }}
                      whileTap={revealed ? {} : { scale: 0.995 }}
                      className="flex w-full items-center gap-3 py-3 px-4 rounded-lg text-sm text-left"
                      style={{
                        border,
                        background: bg,
                        color,
                        fontWeight: isSelected || (revealed && isCorrect) ? 800 : 500,
                        cursor: revealed ? "default" : "pointer",
                        opacity,
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span
                        className="flex w-[28px] h-[28px] items-center justify-center rounded-lg font-extrabold shrink-0"
                        style={{
                          background:
                            revealed && isCorrect
                              ? "var(--success)"
                              : revealed && isSelected && !isCorrect
                                ? "var(--error)"
                                : isSelected
                                  ? "var(--accent)"
                                  : "var(--surface-alt)",
                          fontSize: 11.5,
                          color:
                            (revealed && (isCorrect || (isSelected && !isCorrect))) || isSelected
                              ? "var(--text-on-accent)"
                              : "var(--text-secondary)",
                        }}
                      >
                        {revealed && isCorrect ? (
                          <CircleCheckBig />
                        ) : revealed && isSelected && !isCorrect ? (
                          <XCircle />
                        ) : (
                          OPTION_LABELS[idx]
                        )}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </m.button>
                  );
                })}
              </div>
            ) : (
              // Structured Input Area
              <div className="flex flex-col gap-3">
                <textarea
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={revealed}
                  rows={3}
                  placeholder={
                    currentExercise.instructionVi ?? "Type your rewritten sentence here..."
                  }
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                  className="w-full rounded-lg bg-surface text-text-primary leading-normal py-3 px-4"
                  style={{
                    border: "1.5px solid var(--border)",
                    fontSize: 14.5,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                />
                {!revealed && (
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWrittenAnswer}
                    disabled={!typedAnswer.trim()}
                    className="border-none rounded-full text-[13px] font-extrabold"
                    style={{
                      alignSelf: "flex-end",
                      background: typedAnswer.trim() ? "var(--accent)" : "var(--border)",
                      color: typedAnswer.trim() ? "var(--text-on-accent)" : "var(--text-muted)",
                      cursor: typedAnswer.trim() ? "pointer" : "default",
                      padding: "8px 20px",
                      boxShadow: typedAnswer.trim() ? "0 2px 8px var(--accent-muted)" : "none",
                    }}
                  >
                    Submit Answer <CircleCheckBig />
                  </m.button>
                )}
              </div>
            )}

            {/* Written response results comparison */}
            {revealed && currentExercise.type !== "multiple_choice" && (
              <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
                <div
                  className="rounded-lg border-2 border-border font-medium"
                  style={{
                    padding: "12px 14px",
                    background: isGrammarAnswerCorrect(
                      typedAnswer,
                      currentExercise.answer,
                      currentExercise.acceptedAnswers,
                    )
                      ? "rgba(16, 185, 129, 0.06)"
                      : "rgba(239, 68, 68, 0.06)",
                    fontSize: 13.5,
                  }}
                >
                  <strong className="text-text-secondary">Your Answer:</strong> {typedAnswer}
                </div>
                <div
                  className="rounded-lg text-emerald-500 font-bold"
                  style={{
                    padding: "12px 14px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid var(--success)",
                    fontSize: 13.5,
                  }}
                >
                  <CircleCheckBig style={{ marginRight: 6 }} />
                  {currentExercise.answer}
                </div>
              </div>
            )}

            {/* Explanations block */}
            {revealed && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg bg-surface-alt p-4"
                style={{ border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-extrabold text-accent uppercase tracking-wider"
                    style={{ fontSize: 11.5 }}
                  >
                    <Lightbulb /> Explanation & Rationale
                  </span>
                  <div className="flex overflow-hidden rounded-md border-2 border-border">
                    {(["vi", "en"] as const).map((langOpt) => (
                      <button
                        key={langOpt}
                        onClick={() => setExplLang(langOpt)}
                        className="text-[10.5px] font-extrabold border-none cursor-pointer"
                        style={{
                          padding: "3px 10px",
                          background: explLang === langOpt ? "var(--accent)" : "var(--surface)",
                          color:
                            explLang === langOpt
                              ? "var(--text-on-accent)"
                              : "var(--text-secondary)",
                        }}
                      >
                        {langOpt === "vi" ? "VIE" : "ENG"}
                      </button>
                    ))}
                  </div>
                </div>
                <p
                  className="m-0 text-text-secondary font-medium"
                  style={{ fontSize: 13.5, lineHeight: 1.65 }}
                >
                  {explLang === "en"
                    ? (currentExercise.explanationEn ?? currentExercise.explanation)
                    : currentExercise.explanation}
                </p>
              </m.div>
            )}
          </div>

          {/* Action button */}
          {revealed && (
            <m.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={nextExercise}
              className="rounded-xl border-none text-[15px] font-extrabold cursor-pointer w-full"
              style={{
                padding: "12px 24px",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
                color: "var(--text-on-accent)",
                boxShadow: "0 4px 14px var(--accent-muted)",
              }}
            >
              {exerciseIdx < lesson.exercises.length - 1 ? (
                <>
                  Next Question <ChevronRight />
                </>
              ) : (
                <>
                  View Lesson Results <CircleCheckBig />
                </>
              )}
            </m.button>
          )}
        </div>
      )}

      {/* Completion page summary */}
      {state === "complete" &&
        lesson &&
        (() => {
          const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
          const wrongAnswers = answers.filter((a) => !a.correct);
          const medal =
            scorePct >= 90 ? "🥇" : scorePct >= 70 ? "🥈" : scorePct >= 50 ? "🥉" : "🎓";
          return (
            <m.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-surface border-2 border-border text-center relative overflow-hidden"
              style={{ padding: "40px 24px", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Background glowing circle */}
              <div
                className="absolute w-[220px] h-[220px] rounded-full"
                style={{
                  left: "50%",
                  top: "25%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, var(--success) 10%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div className="relative inline-block mb-5">
                <Trophy size={58} className="text-(--success)" />
                <Star
                  className="absolute text-xl text-(--xp)"
                  style={{ top: -4, right: -12, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                />
              </div>

              <h2 className="mb-2 text-2xl font-black text-text-primary font-display">
                {medal} Lesson Completed!
              </h2>
              <p
                className="text-text-secondary mb-4 font-medium leading-normal"
                style={{ fontSize: 14.5 }}
              >
                Topic: <span className="text-accent font-bold">{lesson.title}</span>
                <br />
                Accuracy Score:{" "}
                <strong className="text-emerald-500">
                  {correctCount}/{lesson.exercises.length}
                </strong>{" "}
                ({scorePct}%)
              </p>

              {xpAwarded > 0 && (
                <div
                  className="items-center gap-1.5 rounded-full text-accent text-base font-black mb-6"
                  style={{
                    display: "inline-flex",
                    padding: "8px 20px",
                    background: "var(--accent-light)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Star /> +{xpAwarded} XP earned
                </div>
              )}

              {alreadyCompleted && (
                <p
                  className="text-text-muted text-xs font-semibold"
                  style={{ margin: "-12px 0 24px" }}
                >
                  You have already earned XP for this lesson.
                </p>
              )}

              {/* Error review logs */}
              {wrongAnswers.length > 0 && (
                <div className="mt-2 mb-6 text-left">
                  <button
                    onClick={() => setShowReview((v) => !v)}
                    className="flex items-center gap-2 w-full py-3 px-4 rounded-lg cursor-pointer text-[13px] font-extrabold text-destructive"
                    style={{
                      border: "1.5px solid color-mix(in srgb, var(--error) 20%, var(--border))",
                      background: "rgba(239, 68, 68, 0.04)",
                    }}
                  >
                    <AlertTriangle /> Review {wrongAnswers.length} saved incorrect items ·{" "}
                    {showReview ? "Collapse" : "Expand"}
                  </button>
                  {showReview && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex flex-col gap-2 mt-2 overflow-hidden"
                    >
                      {wrongAnswers.map((wItem, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-surface-alt border-2 border-border"
                          style={{ padding: 14 }}
                        >
                          <p
                            className="mb-2 font-bold text-text-primary"
                            style={{ fontSize: 13.5 }}
                          >
                            {wItem.questionStem}
                          </p>
                          <div
                            className="flex items-center gap-1.5 text-destructive font-bold"
                            style={{ fontSize: 12.5 }}
                          >
                            <XCircle /> Your Choice: {wItem.userAnswer}
                          </div>
                          <div
                            className="flex items-center gap-1.5 text-emerald-500 font-bold mt-1"
                            style={{ fontSize: 12.5 }}
                          >
                            <CircleCheckBig /> Correct Answer: {wItem.correctAnswer}
                          </div>
                          {wItem.explanationVi && (
                            <div className="mt-2 p-2 bg-surface rounded-md text-xs text-text-muted font-medium">
                              <Lightbulb className="text-accent mr-1" />
                              {wItem.explanationVi}
                            </div>
                          )}
                        </div>
                      ))}
                    </m.div>
                  )}
                </div>
              )}

              {/* Actions button */}
              <div className="flex gap-2.5 justify-center flex-wrap">
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBack}
                  className="rounded-lg bg-surface text-text-primary cursor-pointer font-extrabold"
                  style={{
                    padding: "11px 22px",
                    border: "1.5px solid var(--border)",
                    fontSize: 13.5,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <ArrowLeft /> Back
                </m.button>

                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setState("exercises");
                    setExerciseIdx(0);
                    setCorrectCount(0);
                    setCombo(0);
                    setAnswers([]);
                    setStartedAt(Date.now());
                    resetExerciseInput();
                    setShowReview(false);
                  }}
                  className="rounded-lg text-accent cursor-pointer font-extrabold"
                  style={{
                    padding: "11px 22px",
                    border: "1.5px solid var(--accent)",
                    background: "var(--accent-light)",
                    fontSize: 13.5,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <RefreshCw /> Retry Practice
                </m.button>

                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/grammar-quiz")}
                  className="rounded-lg border-none cursor-pointer font-extrabold"
                  style={{
                    padding: "11px 22px",
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                    fontSize: 13.5,
                    boxShadow: "0 2px 8px var(--accent-muted)",
                  }}
                >
                  Review Quiz
                </m.button>
              </div>
            </m.div>
          );
        })()}
    </div>
  );
}
