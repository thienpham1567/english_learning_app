"use client";

import { useState, useCallback } from "react";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  WarningOutlined,
  FileTextOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { HighlightedText } from "@/app/(app)/english-chatbot/_components/HighlightedText";

type ScriptRevealLevel = "hidden" | "keywords" | "full";

type Props = {
  passage: string;
  keyPhrases?: string[];
  /** Whether the script has already been revealed (affects XP) */
  isRevealed: boolean;
  /** Callback when the user first reveals the script */
  onReveal: () => void;
  /** Optional word click handler for MiniDictionary */
  onWordClick?: (word: string, rect: DOMRect) => void;
  savedWords?: Set<string>;
};

/**
 * ScriptPanel — toggleable transcript overlay during active listening exercise.
 * Supports progressive reveal: hidden → keywords only → full text.
 * First reveal triggers an XP penalty confirmation.
 */
export function ScriptPanel({
  passage,
  keyPhrases = [],
  isRevealed,
  onReveal,
  onWordClick,
  savedWords,
}: Props) {
  const [revealLevel, setRevealLevel] = useState<ScriptRevealLevel>("hidden");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = useCallback(() => {
    if (revealLevel === "hidden") {
      // First reveal — show confirmation unless already revealed
      if (!isRevealed) {
        setShowConfirm(true);
      } else {
        // Already revealed this session, skip confirmation
        setRevealLevel(keyPhrases.length > 0 ? "keywords" : "full");
      }
    } else if (revealLevel === "keywords") {
      setRevealLevel("full");
    } else {
      setRevealLevel("hidden");
    }
  }, [revealLevel, isRevealed, keyPhrases.length]);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    onReveal();
    setRevealLevel(keyPhrases.length > 0 ? "keywords" : "full");
  }, [onReveal, keyPhrases.length]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  /** Render passage with non-key words replaced by blanks */
  const renderKeywordsOnly = useCallback(() => {
    if (!keyPhrases.length) return passage;

    const lowerPhrases = keyPhrases.map((p) => p.toLowerCase());
    return passage.split(/(\s+)/).map((token, i) => {
      const cleanToken = token.replace(/[.,!?;:'"()]/g, "").toLowerCase();
      const isKey = lowerPhrases.some(
        (phrase) => phrase.includes(cleanToken) || cleanToken.includes(phrase),
      );
      if (token.trim() === "") return token;
      if (isKey) {
        return (
          <span key={i} style={{ fontWeight: 600, color: "var(--accent)" }}>
            {token}
          </span>
        );
      }
      return (
        <span key={i} style={{ color: "var(--text-muted)", letterSpacing: 1 }}>
          {"_".repeat(Math.max(token.length, 2))}
        </span>
      );
    });
  }, [passage, keyPhrases]);

  const buttonLabel =
    revealLevel === "hidden"
      ? "Xem script"
      : revealLevel === "keywords"
        ? "Xem toàn bộ"
        : "Ẩn script";

  const buttonIcon =
    revealLevel === "hidden" ? (
      <EyeOutlined />
    ) : (
      <EyeInvisibleOutlined />
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: "var(--radius-md)",
          border: isRevealed
            ? "1px solid color-mix(in srgb, var(--warning) 40%, transparent)"
            : "1px solid var(--border)",
          background: isRevealed
            ? "color-mix(in srgb, var(--warning) 6%, var(--surface))"
            : "var(--surface)",
          color: isRevealed ? "var(--warning)" : "var(--text-secondary)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          transition: "all 0.2s ease",
        }}
      >
        {buttonIcon}
        {buttonLabel}
        {isRevealed && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 99,
              background: "color-mix(in srgb, var(--warning) 15%, transparent)",
              color: "var(--warning)",
              fontWeight: 700,
            }}
          >
            -30% XP
          </span>
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
            background: "color-mix(in srgb, var(--warning) 6%, var(--surface))",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--warning)",
              fontWeight: 600,
            }}
          >
            <WarningOutlined /> Xem script sẽ giảm 30% XP cho bài này
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Bạn vẫn muốn xem script?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--warning)",
                color: "var(--text-on-accent)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Xem script
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Script Content */}
      {revealLevel !== "hidden" && (
        <div
          style={{
            padding: 16,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 3%, var(--surface)), var(--surface))",
            backdropFilter: "blur(8px)",
            fontSize: 14,
            lineHeight: 1.8,
            color: "var(--text)",
            animation: "slideUp 0.25s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            <FileTextOutlined /> Script
            {revealLevel === "keywords" && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                Từ khóa
              </span>
            )}
          </div>

          <div style={{ fontStyle: revealLevel === "full" ? "italic" : "normal" }}>
            {revealLevel === "keywords" ? (
              <div>{renderKeywordsOnly()}</div>
            ) : onWordClick ? (
              <HighlightedText
                text={passage}
                onWordClick={onWordClick}
                savedWords={savedWords}
              />
            ) : (
              passage
            )}
          </div>

          {revealLevel === "full" && onWordClick && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--text-muted)",
                fontStyle: "normal",
              }}
            >
              <BulbOutlined style={{ marginRight: 6 }} />
              Nhấn vào từ để tra từ điển và lưu từ vựng
            </div>
          )}
        </div>
      )}
    </div>
  );
}
