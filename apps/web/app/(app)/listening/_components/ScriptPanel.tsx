"use client";

import { useState, useCallback } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
} from "lucide-react";

type ScriptRevealLevel = "hidden" | "keywords" | "full";

type Props = {
  passage: string;
  keyPhrases?: string[];
  /** Whether the script has already been revealed (affects XP) */
  isRevealed: boolean;
  /** Callback when the user first reveals the script */
  onReveal: () => void;
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
          <span key={i} className="font-semibold text-accent" >
            {token}
          </span>
        );
      }
      return (
        <span key={i} className="text-text-muted" style={{letterSpacing: 1}} >
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
      <Eye />
    ) : (
      <EyeOff />
    );

  return (
    <div className="flex flex-col gap-2" >
      {/* Toggle Button */}
      <button
        onClick={handleToggle} className="flex items-center justify-center gap-2 cursor-pointer text-[13px] font-semibold" style={{padding: "10px 18px", borderRadius: "var(--radius-md)", border: isRevealed
            ? "1px solid color-mix(in srgb, var(--warning) 40%, transparent)"
            : "1px solid var(--border)", background: isRevealed
            ? "color-mix(in srgb, var(--warning) 6%, var(--surface))"
            : "var(--surface)", color: isRevealed ? "var(--warning)" : "var(--text-secondary)", transition: "all 0.2s ease"}} >
        {buttonIcon}
        {buttonLabel}
        {isRevealed && (
          <span className="text-[10px] rounded-full font-bold" style={{padding: "1px 6px", background: "color-mix(in srgb, var(--warning) 15%, transparent)", color: "var(--warning)"}} >
            -30% XP
          </span>
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="flex flex-col gap-2.5" style={{padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)", background: "color-mix(in srgb, var(--warning) 6%, var(--surface))", animation: "fadeIn 0.2s ease"}} >
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{color: "var(--warning)"}} >
            <AlertTriangle /> Xem script sẽ giảm 30% XP cho bài này
          </div>
          <div className="text-xs text-text-secondary" >
            Bạn vẫn muốn xem script?
          </div>
          <div className="flex gap-2" >
            <button
              onClick={handleConfirm} className="flex-1 rounded-(--radius-sm) border-none text-xs font-semibold cursor-pointer" style={{padding: "8px 14px", background: "var(--warning)", color: "var(--text-on-accent)"}} >
              Xem script
            </button>
            <button
              onClick={handleCancel} className="flex-1 rounded-(--radius-sm) border border-(--border) bg-transparent text-xs font-medium cursor-pointer" style={{padding: "8px 14px", color: "var(--text)"}} >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Script Content */}
      {revealLevel !== "hidden" && (
        <div className="p-4 border border-(--border) text-sm" style={{borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 3%, var(--surface)), var(--surface))", backdropFilter: "blur(8px)", lineHeight: 1.8, color: "var(--text)", animation: "slideUp 0.25s ease"}} >
          <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-text-muted uppercase" style={{letterSpacing: "0.1em"}} >
            <FileText /> Script
            {revealLevel === "keywords" && (
              <span className="text-[10px] rounded-full text-accent font-semibold ml-1" style={{padding: "1px 6px", background: "color-mix(in srgb, var(--accent) 12%, transparent)"}} >
                Từ khóa
              </span>
            )}
          </div>

          <div style={{ fontStyle: revealLevel === "full" ? "italic" : "normal" }}>
            {revealLevel === "keywords" ? (
              <div>{renderKeywordsOnly()}</div>
            ) : (
              passage
            )}
          </div>

          {revealLevel === "full" && (
            <div className="mt-2 text-[11px] text-text-muted" style={{fontStyle: "normal"}} >
              <Lightbulb style={{ marginRight: 6 }} />
              Vào trang Từ điển để tra nghĩa chi tiết
            </div>
          )}
        </div>
      )}
    </div>
  );
}
