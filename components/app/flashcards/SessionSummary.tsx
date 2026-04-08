"use client";

import { motion } from "motion/react";
import { BarChart3, Brain, AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  totalReviewed: number;
  averageQuality: number;
  forgottenCount: number;
  onRestart?: () => void;
};

export function SessionSummary({
  totalReviewed,
  averageQuality,
  forgottenCount,
  onRestart,
}: Props) {
  const emoji =
    averageQuality >= 4
      ? "🎉"
      : averageQuality >= 3
        ? "👏"
        : averageQuality >= 2
          ? "👍"
          : "💪";

  return (
    <motion.div
      className="mx-auto flex max-w-md flex-col items-center text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.span
        className="text-6xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
      >
        {emoji}
      </motion.span>

      <h2 className="mt-4 [font-family:var(--font-display)] text-3xl italic text-(--ink)">
        Hoàn thành!
      </h2>
      <p className="mt-2 text-sm text-(--text-secondary)">
        Bạn đã ôn xong {totalReviewed} thẻ trong phiên này.
      </p>

      <div className="mt-8 grid w-full grid-cols-3 gap-4">
        <StatCard
          icon={<BarChart3 size={18} />}
          label="Đã ôn"
          value={String(totalReviewed)}
          delay={0.1}
        />
        <StatCard
          icon={<Brain size={18} />}
          label="Điểm TB"
          value={averageQuality.toFixed(1)}
          delay={0.2}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Quên"
          value={String(forgottenCount)}
          delay={0.3}
        />
      </div>

      {onRestart && (
        <motion.button
          className="mt-8 flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface) px-5 py-2.5 text-sm font-medium text-(--text-secondary) shadow-(--shadow-sm) transition hover:border-(--accent)/40 hover:text-(--accent)"
          onClick={onRestart}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <RefreshCw size={14} />
          Ôn lại
        </motion.button>
      )}
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 rounded-xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow-sm)"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="text-(--accent)">{icon}</span>
      <span className="text-xl font-bold text-(--ink)">{value}</span>
      <span className="text-[11px] text-(--text-muted)">{label}</span>
    </motion.div>
  );
}
