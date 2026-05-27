"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Flame,
  Loader2,
  RotateCw,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { Button } from "@/components/ui/button";
import { useBonusChallenge } from "@/hooks/useBonusChallenge";
import { useDailyChallenge } from "@/hooks/useDailyChallenge";

// Live elapsed timer hook
function useElapsedTimer(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ── Step Indicator ── */
function StepIndicator({
  current,
  total,
  isBonus,
}: {
  current: number;
  total: number;
  isBonus?: boolean;
}) {
  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";
  return (
    <div className="flex flex-col gap-2.5">
      {/* Progress Track */}
      <div className="h-3 border-2 border-border bg-bg-deep rounded-full relative overflow-hidden shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{
            background: `linear-gradient(90deg, ${activeColor}, color-mix(in srgb, ${activeColor} 80%, var(--xp)))`,
          }}
          className="absolute left-0 top-0 bottom-0 rounded-full"
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center text-xs">
        <span className="font-extrabold text-text-secondary font-display uppercase tracking-wider text-[10px]">
          {isBonus ? "Bonus Progress" : "Challenge Progress"}
        </span>
        <span
          style={{ color: activeColor }}
          className="font-black font-mono text-sm leading-none"
        >
          {current + 1} / {total} questions
        </span>
      </div>
    </div>
  );
}

/* ── Exercise Flow ── */
function ExerciseFlow({
  challenge,
  currentExercise,
  onAnswer,
  onSkip,
  formattedTime,
  isBonus,
}: {
  challenge: { exercises: { type: string; data: unknown; instruction: string }[] };
  currentExercise: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  formattedTime: string;
  isBonus?: boolean;
}) {
  const exerciseWrapperRef = useRef<HTMLDivElement>(null);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (exerciseWrapperRef.current) {
        exerciseWrapperRef.current.classList.remove("answer-flash");
        void exerciseWrapperRef.current.offsetWidth;
        exerciseWrapperRef.current.classList.add("answer-flash");
      }
      onAnswer(answer);
    },
    [onAnswer],
  );

  const exerciseTypeLabel = EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise]?.type] ?? "";
  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 w-full max-w-2xl mx-auto"
    >
      {/* Bonus label */}
      {isBonus && (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-warning border-2 border-border self-start shadow-(--shadow-sm) text-black"
        >
          <Zap className="h-3.5 w-3.5 fill-current text-black animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
            BONUS CHALLENGE ROUND
          </span>
        </motion.div>
      )}

      {/* Step indicator row */}
      <div className="flex flex-col gap-3.5">
        <StepIndicator
          current={currentExercise}
          total={challenge.exercises.length}
          isBonus={isBonus}
        />

        {/* Exercise type label */}
        {exerciseTypeLabel && (
          <div className="flex items-center gap-2.5 mt-1">
            <span
              style={{
                color: isBonus ? "#D97706" : "var(--ink)",
                background: isBonus ? "rgba(245,158,11,0.15)" : "var(--accent-light)",
              }}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg font-mono shrink-0 border border-border/10"
            >
              {exerciseTypeLabel}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise}
          ref={exerciseWrapperRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border-2 border-border bg-surface p-6 shadow-(--shadow) relative overflow-hidden"
        >
          {/* Top glowing bar */}
          <div
            style={{
              background: `linear-gradient(90deg, ${activeColor}, var(--xp))`,
            }}
            className="absolute top-0 left-0 right-0 h-1.5"
          />
          <ExerciseCard
            exercise={challenge.exercises[currentExercise] as any}
            onAnswer={handleAnswer}
            disabled={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Skip */}
      <Button
        variant="outline"
        onClick={onSkip}
        className="self-center flex items-center gap-2 text-xs px-6 py-2.5 rounded-xl border-2 border-border shadow-(--shadow-sm) hover:translate-y-[-1px] hover:shadow-(--shadow) active:translate-y-0 active:shadow-none transition-all cursor-pointer font-extrabold mt-2"
      >
        <ArrowRight className="h-4 w-4" />
        <span>Skip this question</span>
      </Button>
    </motion.div>
  );
}

export default function DailyChallengePage() {
  const {
    state,
    challenge,
    streak,
    badges,
    currentExercise,
    results,
    error,
    timeElapsedMs,
    answerExercise,
  } = useDailyChallenge();

  const bonus = useBonusChallenge();

  const BEST_KEY = "daily-challenge-best";
  const [personalBest, setPersonalBest] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_KEY);
      if (stored) setPersonalBest(stored);
    } catch {
      /* ignore */
    }
    setTodayLabel(getTodayLabel());
  }, []);

  useEffect(() => {
    if (state !== "results" || !results || timeElapsedMs <= 0) return;
    const correctCount = results.answers.filter((a) => a.isCorrect).length;
    const total = results.answers.length;
    if (correctCount < total) return;
    const prevMs = personalBest ? parseInt(personalBest, 10) : Infinity;
    if (timeElapsedMs < prevMs) {
      localStorage.setItem(BEST_KEY, String(timeElapsedMs));
      setPersonalBest(String(timeElapsedMs));
    }
  }, [state, results, timeElapsedMs, personalBest]);

  const isInBonusFlow =
    bonus.state === "active" || bonus.state === "submitting" || bonus.state === "results";
  const formattedTime = useElapsedTimer(state === "active" || bonus.state === "active");

  const isChallengeRunning = state === "active" || bonus.state === "active";

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
      {/* ── Bespoke Daily Challenge Header Banner ── */}
      <div className="px-4 pt-5 shrink-0">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border-2 border-border bg-surface p-5 shadow-(--shadow) flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-[linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl border-2 border-border bg-accent text-text-on-accent flex items-center justify-center shrink-0 shadow-(--shadow-sm)">
                <Flame className="h-6 w-6 text-orange-500 fill-current animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-accent font-mono">
                  {todayLabel}
                </span>
                <h1 className="m-0 text-xl font-black font-display text-ink tracking-tight leading-none mt-1">
                  Daily Challenge
                </h1>
                <p className="m-0 mt-1 text-[11px] text-text-muted font-bold font-sans">
                  Streak Booster Challenge
                </p>
              </div>
            </div>

            {/* Live elapsed timer badge */}
            {isChallengeRunning && (
              <div className="flex items-center gap-2 bg-accent-light border-2 border-border px-3.5 py-1.5 rounded-xl shadow-(--shadow-sm) font-mono text-xs font-black text-ink shrink-0 self-start sm:self-center relative z-10">
                <Clock className="h-4 w-4 text-accent fill-current animate-pulse" />
                <span>TIME: {formattedTime}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 pb-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Error banner */}
          {(error || bonus.error) && (
            <div className="flex gap-3 rounded-2xl border-2 border-border bg-error-bg p-4 text-xs text-error mb-5 shadow-(--shadow-sm) animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error || bonus.error}</span>
            </div>
          )}

          {/* ── BONUS FLOW ── */}
          {bonus.state === "active" && bonus.challenge && (
            <ExerciseFlow
              challenge={bonus.challenge}
              currentExercise={bonus.currentExercise}
              onAnswer={bonus.answerExercise}
              onSkip={() => bonus.answerExercise("")}
              formattedTime={formattedTime}
              isBonus
            />
          )}

          {bonus.state === "submitting" && (
            <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 animate-in fade-in duration-200">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center bg-surface shadow-(--shadow-sm)"
              >
                <Check className="h-6 w-6 text-warning" />
              </motion.div>
              <div className="flex items-center gap-2 text-text-secondary text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-spin text-warning" />
                <span>Grading bonus question...</span>
              </div>
            </div>
          )}

          {bonus.state === "results" && bonus.results && (
            <ChallengeResults
              answers={bonus.results.answers}
              score={bonus.results.score}
              streak={streak}
              badges={badges}
              newBadges={[]}
              timeElapsedMs={bonus.timeElapsedMs}
            />
          )}

          {/* ── DAILY FLOW (only show when not in bonus) ── */}
          {!isInBonusFlow && (
            <>
              {/* Loading */}
              {state === "loading" && (
                <div className="min-h-[320px] flex flex-col justify-center py-6 animate-in fade-in duration-250">
                  <div className="w-full space-y-3.5 animate-pulse">
                    <div className="h-4 bg-bg-deep border border-border/20 rounded-lg w-1/3" />
                    <div className="h-28 bg-bg-deep border border-border/20 rounded-2xl w-full" />
                    <div className="h-10 bg-bg-deep border border-border/20 rounded-xl w-1/2 mx-auto" />
                  </div>
                </div>
              )}

              {/* Error retry */}
              {state === "error" && (
                <div className="p-8 text-center bg-surface border-2 border-border rounded-2xl shadow-(--shadow-sm) flex flex-col items-center animate-in fade-in duration-200 max-w-md mx-auto">
                  <AlertTriangle className="h-12 w-12 text-error mb-3" />
                  <h3 className="text-base font-black text-text-primary mb-1 font-display">
                    Unable to Load Challenge
                  </h3>
                  <p className="text-xs text-text-muted mb-4 font-semibold">
                    Please check your network connection or try again later.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2 rounded-xl border-2 border-border bg-accent text-ink shadow-(--shadow-sm) hover:translate-y-[-1px] hover:shadow-(--shadow) active:translate-y-0 active:shadow-none transition-all font-extrabold cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Try reloading page
                  </Button>
                </div>
              )}

              {/* Active exercise */}
              {state === "active" && challenge && (
                <ExerciseFlow
                  challenge={challenge}
                  currentExercise={currentExercise}
                  onAnswer={answerExercise}
                  onSkip={() => answerExercise("")}
                  formattedTime={formattedTime}
                />
              )}

              {/* Submitting */}
              {state === "submitting" && (
                <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 animate-in fade-in duration-200">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-16 h-16 rounded-full border-2 border-border bg-surface flex items-center justify-center shadow-(--shadow-sm)"
                  >
                    <Check className="h-6 w-6 text-accent" />
                  </motion.div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span>Checking your answer...</span>
                  </div>
                </div>
              )}

              {/* Results */}
              {state === "results" && results && (
                <ChallengeResults
                  answers={results.answers}
                  score={results.score}
                  streak={streak}
                  badges={badges}
                  newBadges={results.newBadges}
                  timeElapsedMs={timeElapsedMs}
                />
              )}

              {/* Completed (already done today) */}
              {state === "completed" && challenge && (
                <CompletedState
                  challenge={challenge}
                  streak={streak}
                  badges={badges}
                  onStartBonus={bonus.startBonus}
                  bonusState={bonus.state}
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes answerFlash {
          0%   { box-shadow: var(--shadow-lg); }
          45%  { box-shadow: 0 0 0 8px color-mix(in srgb, var(--success) 22%, transparent);
                 border-color: var(--success); }
          100% { box-shadow: var(--shadow-lg); border-color: var(--border); }
        }
        .answer-flash { animation: answerFlash 0.55s ease-out; }
      `}</style>
    </div>
  );
}
