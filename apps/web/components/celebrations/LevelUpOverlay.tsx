"use client";

import { Sparkles, Star, Target, X, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { triggerConfetti } from "@/components/celebrations/StreakCelebration";

const LEVEL_TITLES: Record<number, string> = {
  1: "Beginner",
  2: "Apprentice",
  3: "Explorer",
  4: "Practitioner",
  5: "Achiever",
  6: "Scholar",
  7: "Expert",
  8: "Master",
  9: "Grandmaster",
  10: "Legend",
};

function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] ?? `Level ${level}`;
}

interface LevelUpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  totalXP: number;
}

export function LevelUpOverlay({ isOpen, onClose, newLevel, totalXP }: LevelUpOverlayProps) {
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (isOpen && !confettiTriggered.current) {
      confettiTriggered.current = true;
      setTimeout(() => {
        triggerConfetti(window.innerWidth / 2, window.innerHeight * 0.35, 50);
      }, 400);
    }
    if (!isOpen) {
      confettiTriggered.current = false;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/60" />

          {/* Card */}
          <m.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border-3 border-border bg-surface p-8 shadow-xl text-center"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-lg bg-transparent border border-border text-text-muted cursor-pointer hover:bg-surface-alt transition-colors"
            >
              <X size={14} />
            </button>

            {/* Stars decoration */}
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-6 left-6 text-xp opacity-30"
            >
              <Star size={16} className="fill-current" />
            </m.div>
            <m.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-8 right-12 text-accent opacity-20"
            >
              <Star size={10} className="fill-current" />
            </m.div>

            {/* Level badge */}
            <m.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, damping: 12 }}
              className="mx-auto w-20 h-20 rounded-2xl border-3 border-accent bg-gradient-to-br from-accent to-accent-hover grid place-items-center mb-5 shadow-lg"
            >
              <span className="text-3xl font-bold text-text-on-accent font-display">
                {newLevel}
              </span>
            </m.div>

            {/* Title */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-accent mb-2 flex items-center justify-center gap-1.5">
                <Sparkles size={12} className="text-xp" />
                Level Up!
                <Sparkles size={12} className="text-xp" />
              </div>
              <h2 className="text-2xl font-bold font-display text-ink m-0 mb-1">
                {getLevelTitle(newLevel)}
              </h2>
              <p className="text-xs text-text-muted font-semibold m-0">
                {totalXP.toLocaleString()} XP earned
              </p>
            </m.div>

            {/* Divider */}
            <div className="h-px bg-border my-5" />

            {/* Perks */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-2"
            >
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted mb-1">
                Unlocked
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-surface-alt text-left">
                <span className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 grid place-items-center text-accent shrink-0">
                  <Target size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-ink">New Challenge Difficulty</div>
                  <div className="text-[10px] text-text-muted">Harder questions = more XP</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-surface-alt text-left">
                <span className="w-8 h-8 rounded-lg bg-xp/10 border border-xp/20 grid place-items-center text-xp shrink-0">
                  <Zap size={16} className="fill-current" />
                </span>
                <div>
                  <div className="text-xs font-bold text-ink">XP Multiplier +10%</div>
                  <div className="text-[10px] text-text-muted">Earn more from every activity</div>
                </div>
              </div>
            </m.div>

            {/* Continue button */}
            <m.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="mt-6 w-full py-3 px-6 rounded-xl border border-accent bg-accent text-text-on-accent font-extrabold text-sm cursor-pointer shadow-sm"
            >
              Continue Learning →
            </m.button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to detect level-up and show the overlay.
 * Compares current level against localStorage-cached last-seen level.
 */
export function useLevelUpDetection(level: number | undefined, totalXP: number | undefined) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, xp: 0 });
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current || !level || !totalXP) return;
    checkedRef.current = true;

    const lastLevel = Number(localStorage.getItem("last-seen-level") ?? "0");
    if (lastLevel > 0 && level > lastLevel) {
      setLevelUpData({ level, xp: totalXP });
      setTimeout(() => setShowLevelUp(true), 1200); // delay for dashboard to load
    }
    localStorage.setItem("last-seen-level", String(level));
  }, [level, totalXP]);

  const closeLevelUp = useCallback(() => setShowLevelUp(false), []);

  return { showLevelUp, levelUpData, closeLevelUp };
}
