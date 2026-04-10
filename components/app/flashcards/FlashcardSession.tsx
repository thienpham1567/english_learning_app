"use client";

import { useEffect } from "react";
import { AppstoreOutlined, ReloadOutlined, DisconnectOutlined } from "@ant-design/icons";
import { Spin } from "antd";

import { useFlashcardSession } from "@/hooks/useFlashcardSession";
import { FlashcardCard } from "@/components/app/flashcards/FlashcardCard";
import { SessionProgress } from "@/components/app/flashcards/SessionProgress";
import { SessionSummary } from "@/components/app/flashcards/SessionSummary";
import { EmptyState } from "@/components/app/flashcards/EmptyState";

export function FlashcardSession() {
  const {
    state,
    currentCard,
    currentIndex,
    totalDue,
    stats,
    isSubmitting,
    nextReviewAt,
    fetchDueCards,
    submitReview,
    restart,
  } = useFlashcardSession();

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

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
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "linear-gradient(180deg, var(--surface), var(--bg))",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 24px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            display: "grid",
            width: 40,
            height: 40,
            placeItems: "center",
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, #8b5cf6, #4f46e5)",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <AppstoreOutlined style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            Ôn tập từ vựng 🧠
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Spaced Repetition · Ghi nhớ lâu dài
          </p>
        </div>
      </div>

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
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)",
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
            <div
              className="anim-fade-in"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Đang tải thẻ ôn tập...</p>
            </div>
          )}

          {state === "error" && (
            <div
              className="anim-fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "grid",
                  width: 64,
                  height: 64,
                  placeItems: "center",
                  borderRadius: "var(--radius-lg)",
                  background: "#fef2f2",
                  color: "#ef4444",
                }}
              >
                <DisconnectOutlined style={{ fontSize: 28 }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                Không thể tải thẻ ôn tập
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Kiểm tra kết nối mạng và thử lại.
              </p>
              <button
                onClick={restart}
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: "var(--radius)",
                  background: "var(--accent)",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined style={{ fontSize: 14 }} />
                Thử lại
              </button>
            </div>
          )}

          {state === "empty" && (
            <div className="anim-fade-in">
              <EmptyState nextReviewAt={nextReviewAt} />
            </div>
          )}

          {state === "active" && currentCard && (
            <div key={`card-${currentIndex}`} className="anim-fade-in" style={{ width: "100%" }}>
              <SessionProgress current={currentIndex + 1} total={totalDue} />
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
                onRestart={restart}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
