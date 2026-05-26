"use client";
import { useState } from "react";
import { Skeleton, Progress, Flex, Button, Result } from "antd";

import * as m from "motion/react-client";

import { useFlashcardSession } from "@/hooks/useFlashcardSession";
import { FlashcardCard } from "@/app/(app)/flashcards/_components/FlashcardCard";
import { SessionProgress } from "@/app/(app)/flashcards/_components/SessionProgress";
import { SessionSummary } from "@/app/(app)/flashcards/_components/SessionSummary";
import { EmptyState } from "@/app/(app)/flashcards/_components/EmptyState";
import { AIFlashcardMode } from "@/app/(app)/flashcards/_components/AIFlashcardMode";
import { BookOpen, Clock, RefreshCw, Zap } from "lucide-react";

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

  return (
    <div className="relative flex h-full h-[0px] flex-1 flex-col overflow-hidden" >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Immersive mode: thin progress bar at the very top */}
      {isImmersive && (
        <Progress
          percent={totalDue > 0 ? Math.round(((currentIndex + 1) / totalDue) * 100) : 0}
          showInfo={false}
          strokeColor={{ from: "var(--accent)", to: "var(--xp)" }}
          size={["100%", 4]}
          style={{ lineHeight: 0 }}
        />
      )}

      {/* Module header — hidden during immersive (active) mode */}
      {!isImmersive && (
        <div className="relative z-[1]" >
        </div>
      )}

      {/* Content */}
      <div className="relative h-[0px] flex-1 overflow-y-auto z-[1]" style={{padding: "20px 16px"}} >
        {/* Ambient glow */}
        <div className="absolute" style={{pointerEvents: "none", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)"}} />

        <div className="relative mx-auto flex w-full w-[720px] flex-col" style={{minHeight: "100%"}} >
          {/* ── Tab Switcher ── */}
          {!isImmersive && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }} className="flex gap-1 p-1 bg-surface-alt border border-(--border) mb-5" style={{borderRadius: 14, alignSelf: "center", boxShadow: "var(--shadow-sm)"}} >
              {([
                { key: "ai" as TabKey, label: "AI Tạo mới", icon: <Zap /> },
                { key: "srs" as TabKey, label: "Ôn tập SRS", icon: <Clock /> },
              ]).map((tab) => (
                <m.button
                  key={tab.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 border-none cursor-pointer text-[13px]" style={{padding: "10px 22px", borderRadius: 10, background: activeTab === tab.key
                      ? "var(--surface)"
                      : "transparent", color: activeTab === tab.key
                      ? "var(--accent)"
                      : "var(--text-muted)", fontWeight: activeTab === tab.key ? 800 : 600, boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none", transition: "all 0.15s"}} >
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
            <div className="flex flex-1 flex-col items-center justify-center" >
              {state === "loading" && (
                <div className="anim-fade-in w-full w-[500px] p-6" >
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              )}

              {state === "error" && (
                <Flex vertical align="center" gap={16} className="anim-fade-in text-center" >
                  <Result
                    status="error"
                    title="Không thể tải thẻ ôn tập"
                    subTitle="Kiểm tra kết nối mạng và thử lại."
                    extra={
                      <Button type="primary" icon={<RefreshCw />} onClick={restart}>
                        Thử lại
                      </Button>
                    }
                  />
                </Flex>
              )}

              {state === "empty" && (
                <div className="anim-fade-in">
                  <EmptyState nextReviewAt={nextReviewAt} />
                </div>
              )}

              {state === "active" && currentCard && (
                <div key={`card-${currentIndex}`} className="anim-fade-in w-full" >
                  <SessionProgress
                    current={currentIndex + 1}
                    total={totalDue}
                    startTime={sessionStartedAt ?? undefined}
                  />
                  <FlashcardCard card={currentCard} onRate={submitReview} isSubmitting={isSubmitting} />
                </div>
              )}

              {state === "summary" && (
                <div className="anim-fade-in w-full" >
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
