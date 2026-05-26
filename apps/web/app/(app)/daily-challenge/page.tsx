"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  RotateCw,
  Loader2,
  Check,
  ArrowRight,
  Flame,
  Zap,
  Clock,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useBonusChallenge } from "@/hooks/useBonusChallenge";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

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
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ── Modern Step Indicator ── */
function StepIndicator({ current, total, isBonus }: { current: number; total: number; isBonus?: boolean }) {
  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";
  return (
    <div className="flex flex-col gap-2.5">
      {/* Progress Track */}
      <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full relative overflow-hidden shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((current) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{
            background: `linear-gradient(90deg, ${activeColor}, color-mix(in srgb, ${activeColor} 80%, var(--xp)))`,
            boxShadow: `0 0 8px ${activeColor}`,
          }}
          className="absolute left-0 top-0 bottom-0 rounded-full"
        />
      </div>

      {/* Dots & Labels */}
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-400">
          Tiến độ bài học
        </span>
        <span style={{ color: activeColor }} className="font-extrabold font-mono text-sm leading-none">
          {current + 1} / {total} câu
        </span>
      </div>
    </div>
  );
}

/* ── Shared Exercise Flow — used by both daily & bonus ── */
function ExerciseFlow({
  challenge,
  currentExercise,
  onAnswer,
  onSkip,
  formattedTime: _formattedTime,
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

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise]?.type] ?? "";

  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Bonus label */}
      {isBonus && (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 border border-white/10 self-start shadow-md text-white"
        >
          <Zap className="h-3 w-3 fill-current text-white animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
            VÒNG THỬ THÁCH BONUS
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
          <div className="flex items-center gap-2.5">
            <span
              style={{
                color: activeColor,
                background: isBonus ? "rgba(245,158,11,0.1)" : "var(--accent-light)",
              }}
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg font-mono shrink-0"
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
          className="rounded-2xl border border-border bg-surface p-6 shadow-md relative overflow-hidden"
        >
          {/* Top glowing bar */}
          <div
            style={{
              background: `linear-gradient(90deg, ${activeColor}, var(--xp))`,
            }}
            className="absolute top-0 left-0 right-0 h-1"
          />
          <ExerciseCard
            exercise={challenge.exercises[currentExercise] as any}
            onAnswer={handleAnswer}
            disabled={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Skip */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onSkip}
        className="self-center flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white px-5 py-2 rounded-full cursor-pointer shadow-sm transition-all"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        <span>Bỏ qua câu hỏi này</span>
      </motion.button>
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
    } catch { /* ignore */ }
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

  const isInBonusFlow = bonus.state === "active" || bonus.state === "submitting" || bonus.state === "results";
  const formattedTime = useElapsedTimer(state === "active" || bonus.state === "active");

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-950">
      
      {/* ── Module Header ── */}
      <div className="px-4 pt-5 shrink-0">
        <div className="max-w-2xl mx-auto">
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 pb-12">
        <div className="w-full max-w-2xl mx-auto">

          {/* Error banner */}
          {(error || bonus.error) && (
            <div className="flex gap-3 rounded-2xl border border-red-950 bg-red-950/20 p-4 text-xs text-red-400 mb-5 shadow-sm animate-in fade-in duration-200">
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
                className="w-16 h-16 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-900"
              >
                <Check className="h-6 w-6 text-amber-500" />
              </motion.div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-text-amber-500" />
                <span>Đang chấm điểm câu hỏi phụ...</span>
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
                    <div className="h-4 bg-slate-900 border border-slate-850 rounded-lg w-1/3" />
                    <div className="h-24 bg-slate-900 border border-slate-850 rounded-2xl w-full" />
                    <div className="h-10 bg-slate-900 border border-slate-850 rounded-xl w-1/2 mx-auto" />
                  </div>
                </div>
              )}

              {/* Error retry */}
              {state === "error" && (
                <div className="p-8 text-center bg-surface border border-border rounded-2xl shadow-sm flex flex-col items-center animate-in fade-in duration-200">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
                  <h3 className="text-base font-bold text-slate-150 mb-1">Không thể tải thử thách hôm nay</h3>
                  <p className="text-xs text-slate-550 mb-4">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
                  <Button onClick={() => window.location.reload()}>
                    <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Thử tải lại trang
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
                    className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center bg-slate-900 shadow-sm shadow-accent/20"
                  >
                    <Check className="h-6 w-6 text-accent" />
                  </motion.div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                    <Loader2 className="h-4 w-4 animate-text-accent" />
                    <span>Hệ thống đang kiểm tra câu trả lời...</span>
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
