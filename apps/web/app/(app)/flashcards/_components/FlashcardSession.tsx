"use client";

import { AlertTriangle, BookOpen, Clock, Loader2, RefreshCw, Zap } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { AIFlashcardMode } from "@/app/(app)/flashcards/_components/AIFlashcardMode";
import { EmptyState } from "@/app/(app)/flashcards/_components/EmptyState";
import { FlashcardCard } from "@/app/(app)/flashcards/_components/FlashcardCard";
import { SessionProgress } from "@/app/(app)/flashcards/_components/SessionProgress";
import { SessionSummary } from "@/app/(app)/flashcards/_components/SessionSummary";
import { useFlashcardSession } from "@/hooks/useFlashcardSession";

type TabKey = "srs" | "ai";

export function FlashcardSession() {
  const [activeTab, setActiveTab] = useState<TabKey>("ai");
  const {
    state,
    currentCard,
    currentIndex,
    totalDue,
    stats,
    isSubmitting,
    nextReviewAt,
    sessionStartedAt,
    submitReview,
    restart,
  } = useFlashcardSession();

  const isImmersive = activeTab === "srs" && state === "active";
  const progressPct = totalDue > 0 ? Math.round(((currentIndex + 1) / totalDue) * 100) : 0;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Immersive mode: thin progress bar at the very top */}
      {isImmersive && (
        <div className="h-1 bg-border shrink-0 relative overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{ background: "linear-gradient(90deg, var(--accent), var(--xp))" }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto z-[1] py-5 px-4">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex w-full max-w-[720px] flex-col min-h-full">
          {/* ── Tab Switcher ── */}
          {!isImmersive && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-1 p-1 bg-surface-alt border-2 border-border mb-5 rounded-2xl self-center shadow-sm"
            >
              {[
                { key: "ai" as TabKey, label: "AI Generation", icon: <Zap size={16} /> },
                { key: "srs" as TabKey, label: "SRS Review", icon: <Clock size={16} /> },
              ].map((tab) => (
                <m.button
                  key={tab.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 border-none cursor-pointer text-[13px] py-2.5 px-5 rounded-xl transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-accent text-ink font-black shadow-sm"
                      : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
                  }`}
                >
                  {tab.icon} {tab.label}
                </m.button>
              ))}
            </m.div>
          )}

          {/* ── AI Tab ── */}
          {activeTab === "ai" && (
            <div className="anim-fade-in">
              <AIFlashcardMode />
            </div>
          )}

          {/* ── SRS Tab ── */}
          {activeTab === "srs" && (
            <div className="flex flex-1 flex-col items-center justify-center">
              {state === "loading" && (
                <div className="anim-fade-in w-full max-w-[500px] p-6 flex flex-col gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-4 rounded-lg bg-border animate-pulse ${
                        i === 1 ? "w-4/5" : i === 2 ? "w-3/5" : i === 3 ? "w-2/5" : "w-1/3"
                      }`}
                    />
                  ))}
                </div>
              )}

              {state === "error" && (
                <div className="anim-fade-in text-center flex flex-col items-center gap-4">
                  <AlertTriangle className="text-4xl text-error" />
                  <h3 className="text-lg font-extrabold text-ink">Could not load flashcards</h3>
                  <p className="text-sm text-text-secondary">
                    Please check your network connection and try again.
                  </p>
                  <m.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={restart}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-lg border-none text-sm font-bold cursor-pointer text-[var(--text-on-accent)] shadow-[0_4px_14px_var(--accent-muted)]"
                    style={{
                      background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    }}
                  >
                    <RefreshCw size={14} /> Try again
                  </m.button>
                </div>
              )}

              {state === "empty" && (
                <div className="anim-fade-in">
                  <EmptyState nextReviewAt={nextReviewAt} />
                </div>
              )}

              {state === "active" && currentCard && (
                <div key={`card-${currentIndex}`} className="anim-fade-in w-full">
                  <SessionProgress
                    current={currentIndex + 1}
                    total={totalDue}
                    startTime={sessionStartedAt ?? undefined}
                  />
                  <FlashcardCard
                    card={currentCard}
                    onRate={submitReview}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}

              {state === "summary" && (
                <div className="anim-fade-in w-full">
                  <SessionSummary
                    totalReviewed={stats.totalReviewed}
                    averageQuality={
                      stats.totalReviewed > 0 ? stats.totalQuality / stats.totalReviewed : 0
                    }
                    forgottenCount={stats.forgottenCount}
                    againCount={stats.againCount}
                    hardCount={stats.hardCount}
                    goodCount={stats.goodCount}
                    easyCount={stats.easyCount}
                    onRestart={restart}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
