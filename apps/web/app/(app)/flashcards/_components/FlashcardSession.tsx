"use client";
import { Spin, Progress, Flex, Typography, Button, Result } from "antd";
import { BookOutlined, ReloadOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useFlashcardSession } from "@/hooks/useFlashcardSession";
import { FlashcardCard } from "@/app/(app)/flashcards/_components/FlashcardCard";
import { SessionProgress } from "@/app/(app)/flashcards/_components/SessionProgress";
import { SessionSummary } from "@/app/(app)/flashcards/_components/SessionSummary";
import { EmptyState } from "@/app/(app)/flashcards/_components/EmptyState";

const { Text } = Typography;

export function FlashcardSession() {
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

  const isImmersive = state === "active";

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
        <ModuleHeader
          icon={<BookOutlined />}
          gradient="var(--gradient-flashcards)"
          title="Ôn tập từ vựng"
          subtitle="Spaced Repetition · Ghi nhớ lâu dài"
        />
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            margin: "0 auto",
            display: "flex",
            minHeight: "100%",
            width: "100%",
            maxWidth: 700,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {state === "loading" && (
            <Flex vertical align="center" gap={16} className="anim-fade-in">
              <Spin size="large" />
              <Text type="secondary">Đang tải thẻ ôn tập...</Text>
            </Flex>
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
      </div>
    </div>
  );
}
