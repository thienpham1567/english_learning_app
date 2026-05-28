"use client";

import {
  ArrowLeftRight,
  BookOpenText,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  HelpCircle,
  Languages,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Pencil,
  Search,
  Square,
  Star,
  Trophy,
  Type,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { CelebrationOverlay } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { Badge, ExerciseAnswer, StreakInfo } from "@/lib/daily-challenge/types";
import { BadgeGallery } from "./BadgeGallery";

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, label: "Perfect!", sub: "All answers are correct" },
  { min: 4, tier: "medium" as const, label: "Excellent!", sub: "Almost perfect score" },
  { min: 3, tier: "small" as const, label: "Well Done!", sub: "You are progressing quickly" },
  { min: 0, tier: null, label: "Keep Trying!", sub: "Practice more to get a perfect score" },
];

/* ── Exercise type maps ── */
const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  "fill-in-blank": <Pencil className="h-3.5 w-3.5" />,
  "sentence-order": <ArrowLeftRight className="h-3.5 w-3.5" />,
  translation: <Languages className="h-3.5 w-3.5" />,
  "error-correction": <Search className="h-3.5 w-3.5" />,
  "word-formation": <Type className="h-3.5 w-3.5" />,
  "dialogue-completion": <MessageSquare className="h-3.5 w-3.5" />,
  "synonym-antonym": <LinkIcon className="h-3.5 w-3.5" />,
  "reading-comprehension": <BookOpenText className="h-3.5 w-3.5" />,
  collocation: <Square className="h-3.5 w-3.5" />,
};

const EXERCISE_LABELS: Record<string, string> = {
  "fill-in-blank": "Fill in the Blank",
  "sentence-order": "Sentence Order",
  translation: "Translation",
  "error-correction": "Error Correction",
  "word-formation": "Word Formation",
  "dialogue-completion": "Dialogue Completion",
  "synonym-antonym": "Synonym / Antonym",
  "reading-comprehension": "Reading Comprehension",
  collocation: "Collocation",
};

/* ── Answer Detail Card ── */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const ok = answer.isCorrect;
  const exerciseIcon = answer.exerciseType ? EXERCISE_ICONS[answer.exerciseType] : <HelpCircle className="h-3.5 w-3.5" />;
  const exerciseLabel = answer.exerciseType ? EXERCISE_LABELS[answer.exerciseType] : "";

  const fetchAIExplanation = useCallback(async () => {
    if (aiExplanation || aiLoading) return;
    setAiLoading(true);
    try {
      const data = await api.post<{ explanation: string }>("/daily-challenge/explain", {
        exercise: { type: answer.exerciseType, instruction: "", data: answer.questionStem },
        userAnswer: answer.answer,
        isCorrect: answer.isCorrect,
      });
      setAiExplanation(data.explanation);
    } catch {
      setAiExplanation("Unable to connect to the AI server for explanations. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  }, [answer, aiExplanation, aiLoading]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index + 1, 6) * 0.08 }}
      className={`rounded-2xl border-2 bg-surface overflow-hidden shadow-sm ${
        ok ? "border-success/30" : "border-error/25"
      }`}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className={`flex items-center justify-between w-full border-none cursor-pointer gap-3 p-4 text-left transition-colors duration-150 ${
          ok ? "bg-success/5 hover:bg-success/10" : "bg-error/5 hover:bg-error/10"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              ok ? "bg-success shadow-[0_0_8px_var(--success)]" : "bg-error shadow-[0_0_8px_var(--error)]"
            }`}
          />
          <div className="flex flex-col items-start min-w-0">
            <span className="font-display text-sm font-black text-text-primary leading-none">
              Question #{index + 1}
            </span>
            {exerciseLabel && (
              <span className="items-center text-[10px] text-text-muted font-bold mt-1.5 flex gap-1.5 font-sans">
                {exerciseIcon} 
                <span>{exerciseLabel}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border font-mono ${
              ok
                ? "bg-success-bg border-success/35 text-success"
                : "bg-error-bg border-error/25 text-error"
            }`}
          >
            {ok ? "Correct" : "Incorrect"}
          </span>
          <ChevronDown
            className="text-text-muted h-4 w-4 transition-transform duration-200"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            }}
          />
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden bg-surface"
          >
            <div className="flex flex-col gap-3 p-4 pt-1.5">
              {/* Question stem */}
              {answer.questionStem && (
                <Card shadowSize="sm" size="sm" bgType="alt" className="p-3.5">
                  <span className="text-[9px] font-extrabold uppercase text-text-muted block mb-1.5 tracking-wider font-display">
                    Question Stem
                  </span>
                  <span className="text-xs md:text-sm text-text-primary font-semibold leading-relaxed break-words">
                    {answer.questionStem}
                  </span>
                </Card>
              )}

              {/* User answer */}
              <div
                className={`rounded-xl border-l-4 border-2 p-3.5 shadow-sm ${
                  ok
                    ? "border-l-success border-success/20 bg-success/5"
                    : "border-l-error border-error/20 bg-error/5"
                }`}
              >
                <span
                  className={`text-[9px] font-extrabold uppercase block mb-1 tracking-wider font-display ${
                    ok ? "text-success" : "text-error"
                  }`}
                >
                  Your Answer
                </span>
                <span className="font-bold text-text-primary font-body text-xs md:text-sm break-words">
                  {answer.answer || "(blank)"}
                </span>
              </div>

              {/* Correct answer (wrong only) */}
              {!ok && answer.correctAnswer && (
                <div className="rounded-xl border-l-4 border-2 border-border border-l-success bg-success/5 p-3.5 shadow-sm">
                  <span className="text-[9px] font-extrabold uppercase text-success block mb-1 tracking-wider font-display">
                    Correct Answer
                  </span>
                  <span className="font-bold text-success font-body text-xs md:text-sm break-words">
                    {answer.correctAnswer}
                  </span>
                </div>
              )}

              {/* Static explanation */}
              {answer.explanation && (
                <div className="flex gap-2.5 items-start p-1.5 mt-0.5 bg-surface-alt border border-border/20 rounded-xl">
                  <Lightbulb className="text-accent h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-text-secondary text-xs font-semibold m-0 break-words">
                    {answer.explanation}
                  </p>
                </div>
              )}

              {/* AI Explanation Button */}
              {!aiExplanation && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchAIExplanation();
                  }}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 py-2.5 px-4.5 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent text-[11px] font-black cursor-pointer shadow-sm mt-1.5 w-fit"
                  style={{
                    cursor: aiLoading ? "wait" : "pointer",
                  }}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" /> 
                      <span>AI is analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-3.5 w-3.5" /> 
                      <span>Ask AI for details</span>
                    </>
                  )}
                </m.button>
              )}

              {/* AI Explanation Content */}
              {aiExplanation && (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 rounded-xl p-4 bg-gradient-to-r from-accent-light/40 to-surface border-2 border-accent/20 shadow-sm flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-accent fill-current" />
                    <span className="text-[10px] font-extrabold uppercase text-accent tracking-wider font-display">
                      AI Assistant Explanation
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-text-primary m-0 font-body font-semibold leading-relaxed break-words">
                    {aiExplanation}
                  </p>
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/* ── Main Results Component ── */
type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

export function ChallengeResults({
  answers,
  score,
  streak,
  badges,
  newBadges,
  timeElapsedMs,
}: Props) {
  const matched = TIERS.find((t) => score >= t.min)!;
  const [showCelebration, setShowCelebration] = useState(matched.tier !== null);

  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <>
      {matched.tier && (
        <CelebrationOverlay
          tier={matched.tier}
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        >
          <span className="font-display text-3xl font-black text-accent">
            {matched.label}
          </span>
        </CelebrationOverlay>
      )}

      <div className="anim-scale-in w-full max-w-2xl mx-auto flex flex-col gap-5">
        {/* ── Score Hero Card ── */}
        <Card shadowSize="md" className="p-8 text-center relative overflow-hidden transition-all duration-200">
          {/* Top linear line */}
          <div className="absolute h-1.5 top-0 left-0 right-0 bg-gradient-to-r from-accent to-secondary" />

          {/* Score Counter */}
          <div className="flex items-baseline justify-center gap-1.5 mb-2.5">
            <m.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 85, damping: 11 }}
              className="font-display font-black leading-none text-8xl tracking-tighter"
              style={{
                color:
                  correctCount === answers.length
                    ? "var(--success)"
                    : correctCount >= answers.length * 0.6
                      ? "var(--text-primary)"
                      : "var(--accent)",
              }}
            >
              {correctCount}
            </m.span>
            <span className="font-display text-3xl font-normal text-text-muted tracking-tight">
              /{answers.length}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl md:text-3xl font-black text-text-primary m-0 tracking-tight leading-none mb-1.5">
            {matched.label}
          </h2>
          <p className="font-sans text-text-muted m-0 font-bold text-xs md:text-sm">
            {matched.sub} · Accuracy {pct}%
          </p>

          {/* Dash */}
          <div className="w-14 h-0.5 mx-auto my-5 bg-border/60" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <CheckCircle className="text-emerald-500 h-4.5 w-4.5" />,
                label: "Correct",
                value: correctCount,
              },
              { 
                icon: <XCircle className="text-error h-4.5 w-4.5" />, 
                label: "Wrong", 
                value: wrongCount 
              },
              {
                icon: <Clock className="text-accent h-4.5 w-4.5" />,
                label: "Time Spent",
                value: `${minutes}:${seconds.toString().padStart(2, "0")}`,
              },
              {
                icon: <Flame className="h-4.5 w-4.5" style={{ color: "var(--fire)" }} />,
                label: "Streak Days",
                value: `${streak.currentStreak}d`,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-alt border-2 border-border p-3 shadow-sm"
              >
                <span>{s.icon}</span>
                <span className="font-mono text-base font-black text-text-primary leading-none mt-0.5">
                  {s.value}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted font-display mt-0.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── New Badges ── */}
        {newBadges.length > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-accent bg-accent/5 p-4.5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-accent fill-current animate-pulse shrink-0" />
              <span className="text-[10px] font-extrabold uppercase text-accent tracking-widest font-display">
                New Badge Unlocked!
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {newBadges.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 text-xs rounded-xl bg-surface border-2 border-accent/30 font-black text-text-primary px-4 py-1.5 shadow-sm"
                >
                  {b.icon === "Trophy" ? (
                    <Trophy className="text-accent h-4 w-4 shrink-0" />
                  ) : (
                    <Flame className="text-orange-500 h-4 w-4 shrink-0" />
                  )}
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </m.div>
        )}

        {/* ── Answer Breakdown header ── */}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-[10px] font-extrabold uppercase text-text-muted tracking-widest font-display">
            Answer Details
          </span>
          <div className="flex-1 h-[1px] bg-border/60" />
        </div>

        {/* Answer Cards */}
        <div className="flex flex-col gap-3">
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </div>

        {/* Badges Gallery */}
        <div>
          <BadgeGallery badges={badges} />
        </div>

        {/* CTA */}
        <div className="mt-2.5 flex flex-col items-center gap-3 w-full">
          <Link
            href="/daily-challenge"
            prefetch={false}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-[15px] px-6 py-4.5 bg-accent border-2 border-border text-ink shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
          >
            <span>Done & Continue</span>
            <ChevronRight size={15} />
          </Link>
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider font-display">Come back tomorrow!</span>
        </div>
      </div>
    </>
  );
}
