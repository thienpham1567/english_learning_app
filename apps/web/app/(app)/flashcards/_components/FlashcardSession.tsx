"use client";
import { useState } from "react";
import { Skeleton, Progress, Flex, Button, Result } from "antd";
import {
  BookOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";

import { useFlashcardSession } from "@/hooks/useFlashcardSession";
import { FlashcardCard } from "@/app/(app)/flashcards/_components/FlashcardCard";
import { SessionProgress } from "@/app/(app)/flashcards/_components/SessionProgress";
import { SessionSummary } from "@/app/(app)/flashcards/_components/SessionSummary";
import { EmptyState } from "@/app/(app)/flashcards/_components/EmptyState";
import { AIFlashcardMode } from "@/app/(app)/flashcards/_components/AIFlashcardMode";

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
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
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
        <div style={{ position: "relative", zIndex: 1 }}>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          zIndex: 1,
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            margin: "0 auto",
            display: "flex",
            width: "100%",
            maxWidth: 720,
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          {/* ── Tab Switcher ── */}
          {!isImmersive && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 14,
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                marginBottom: 20,
                alignSelf: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {([
                { key: "ai" as TabKey, label: "AI Tạo mới", icon: <ThunderboltOutlined /> },
                { key: "srs" as TabKey, label: "Ôn tập SRS", icon: <ClockCircleOutlined /> },
              ]).map((tab) => (
                <m.button
                  key={tab.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: activeTab === tab.key
                      ? "var(--surface)"
                      : "transparent",
                    color: activeTab === tab.key
                      ? "var(--accent)"
                      : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? 800 : 600,
                    boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
                    transition: "all 0.15s",
                  }}
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
            <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {state === "loading" && (
                <div className="anim-fade-in" style={{ width: "100%", maxWidth: 500, padding: 24 }}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              )}

              {state === "error" && (
                <Flex vertical align="center" gap={16} className="anim-fade-in" style={{ textAlign: "center" }}>
                  <Result
                    status="error"
                    title="Không thể tải thẻ ôn tập"
                    subTitle="Kiểm tra kết nối mạng và thử lại."
                    extra={
                      <Button type="primary" icon={<ReloadOutlined />} onClick={restart}>
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
                <div key={`card-${currentIndex}`} className="anim-fade-in" style={{ width: "100%" }}>
                  <SessionProgress
                    current={currentIndex + 1}
                    total={totalDue}
                    startTime={sessionStartedAt ?? undefined}
                  />
                  <FlashcardCard card={currentCard} onRate={submitReview} isSubmitting={isSubmitting} />
                </div>
              )}

              {state === "summary" && (
                <div className="anim-fade-in" style={{ width: "100%" }}>
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
