"use client";

import { AlertTriangle, Eye, EyeOff, FileText, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";

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
export function ScriptPanel({ passage, keyPhrases = [], isRevealed, onReveal }: Props) {
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
          <span key={i} className="font-semibold text-accent">
            {token}
          </span>
        );
      }
      return (
        <span key={i} className="text-text-muted tracking-wide">
          {"_".repeat(Math.max(token.length, 2))}
        </span>
      );
    });
  }, [passage, keyPhrases]);

  const buttonLabel =
    revealLevel === "hidden"
      ? "Show Script"
      : revealLevel === "keywords"
        ? "Show Full"
        : "Hide Script";

  const buttonIcon = revealLevel === "hidden" ? <Eye size={15} /> : <EyeOff size={15} />;

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center justify-center gap-2 cursor-pointer text-[13px] font-bold py-2.5 px-4 rounded-lg border-2 border-border transition-all duration-100 ${
          isRevealed
            ? "bg-warning-bg text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_40%,var(--border))]"
            : "bg-surface text-text-secondary hover:bg-surface-hover"
        }`}
      >
        {buttonIcon}
        {buttonLabel}
        {isRevealed && (
          <span className="text-[10px] rounded-full font-bold py-0.5 px-1.5 bg-warning-bg text-[var(--warning)]">
            -30% XP
          </span>
        )}
      </motion.button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col gap-2.5 p-3.5 px-4.5 rounded-lg border-2 border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-warning-bg"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--warning)]">
              <AlertTriangle size={15} /> Viewing the script will reduce XP by 30% for this exercise
            </div>
            <div className="text-xs text-text-secondary">Do you still want to view the script?</div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg border-2 border-border text-xs font-bold cursor-pointer py-2 px-3.5 bg-[var(--warning)] text-ink shadow-(--shadow-sm) hover:-translate-y-0.5 transition-all duration-100"
              >
                Show Script
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border-2 border-border bg-surface text-xs font-medium cursor-pointer py-2 px-3.5 text-text-primary hover:bg-surface-hover transition-all duration-100"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Script Content */}
      <AnimatePresence>
        {revealLevel !== "hidden" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-2 border-border text-sm rounded-lg bg-surface leading-[1.8] text-text-primary shadow-(--shadow-sm)">
              <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                <FileText size={13} /> Script
                {revealLevel === "keywords" && (
                  <span className="text-[10px] rounded-full text-accent font-semibold ml-1 py-0.5 px-1.5 bg-accent-muted">
                    Keywords
                  </span>
                )}
              </div>

              <div className={revealLevel === "full" ? "italic" : ""}>
                {revealLevel === "keywords" ? <div>{renderKeywordsOnly()}</div> : passage}
              </div>

              {revealLevel === "full" && (
                <div className="mt-2 text-[11px] text-text-muted flex items-center gap-1.5">
                  <Lightbulb size={12} />
                  Go to the Dictionary page for detailed lookups
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
