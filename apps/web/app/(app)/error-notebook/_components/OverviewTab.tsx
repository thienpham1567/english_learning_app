"use client";

import {
  AlertCircle,
  BarChart2,
  Brain,
  CheckCircle,
  Clock,
  Database,
  FileText,
} from "lucide-react";
import * as m from "motion/react-client";
import { useMemo } from "react";
import type { ErrorEntry } from "../_types/types";
import { MODULE_ICONS, MODULE_LABELS } from "../_types/types";
import { ErrorPatternSummary } from "./ErrorPatternSummary";
import { ErrorTrendSection } from "./ErrorTrendSection";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  errors: ErrorEntry[];
  total: number;
  unresolvedCount: number;
  resolvedCount: number;
  dueCount: number;
  loading: boolean;
  onGoToReview: () => void;
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  icon,
  color,
  index,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "error" | "success" | "warning" | "accent";
  index: number;
}) {
  const colorMap = {
    error: {
      text: value > 0 ? "text-error" : "text-text-muted",
      bg: "bg-error/8",
      border: "border-error/20",
      iconBg: "bg-error/10",
      iconText: "text-error",
    },
    success: {
      text: "text-success",
      bg: "bg-success/8",
      border: "border-success/20",
      iconBg: "bg-success/10",
      iconText: "text-success",
    },
    warning: {
      text: value > 0 ? "text-warning" : "text-text-muted",
      bg: "bg-warning/8",
      border: "border-warning/20",
      iconBg: "bg-warning/10",
      iconText: "text-warning",
    },
    accent: {
      text: "text-ink",
      bg: "bg-accent-light",
      border: "border-accent/15",
      iconBg: "bg-accent/10",
      iconText: "text-accent",
    },
  };

  const c = colorMap[color];

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 250, damping: 20 }}
      whileHover={{ y: -3 }}
    >
      <Card
        size="sm"
        shadowSize="sm"
        className={cn("flex-row items-center gap-3.5 cursor-default bg-surface border-2", c.border)}
      >
        <span
          className={cn(
            "w-10 h-10 rounded-xl grid place-items-center border-2 shrink-0",
            c.iconBg,
            c.iconText,
            c.border,
          )}
        >
          {icon}
        </span>
        <div>
          <div className={cn("text-[28px] font-black leading-none font-display", c.text)}>
            {value}
          </div>
          <div className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-wide">
            {label}
          </div>
        </div>
      </Card>
    </m.div>
  );
}

export function OverviewTab({
  errors,
  total,
  unresolvedCount,
  resolvedCount,
  dueCount,
  loading,
  onGoToReview,
}: OverviewTabProps) {
  /* ── Module distribution ── */
  const moduleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of errors) {
      const mod = e.sourceModule;
      counts[mod] = (counts[mod] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [errors]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <m.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm text-text-muted font-semibold"
        >
          Loading data...
        </m.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Unresolved"
          value={unresolvedCount}
          icon={<AlertCircle size={18} />}
          color="error"
          index={0}
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={<CheckCircle size={18} />}
          color="success"
          index={1}
        />
        <StatCard
          label="Needs Review"
          value={dueCount}
          icon={<Clock size={18} />}
          color="warning"
          index={2}
        />
        <StatCard
          label="Total Errors"
          value={total}
          icon={<Database size={18} />}
          color="accent"
          index={3}
        />
      </div>

      {/* ─── SRS Review CTA ─── */}
      {dueCount > 0 && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onGoToReview}
          className="w-full text-left p-0 border-none bg-transparent cursor-pointer font-body block"
        >
          <Card
            interactive
            shadowSize="default"
            accentColor="accent"
            accentPosition="left"
            bgType="accent-light"
            className="flex-row items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 border-2 border-accent/15 grid place-items-center shrink-0">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <div className="text-left">
              <div className="text-base font-black text-ink font-display">
                Review Now — {dueCount} errors to recall
              </div>
              <div className="text-xs text-text-muted font-medium mt-0.5">
                Flashcards + AI explanations help you retain information longer
              </div>
            </div>
          </Card>
        </m.button>
      )}

      {/* ─── Module Distribution ─── */}
      {moduleStats.length > 0 && (
        <Card shadowSize="default">
          <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2 font-display">
            <BarChart2 className="h-4 w-4 text-accent" />
            Distribution by Source
          </span>
          <div className="flex flex-col gap-3">
            {moduleStats.map(([mod, count], i) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <m.div
                  key={mod}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-accent/8 border-2 border-accent/15 grid place-items-center">
                    {(() => {
                      const Icon = MODULE_ICONS[mod] || FileText;
                      return <Icon className="h-4 w-4 text-accent" />;
                    })()}
                  </span>
                  <span className="text-[13px] font-bold text-ink w-[110px] shrink-0 truncate">
                    {MODULE_LABELS[mod] ?? mod}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-border/50 overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 3)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
                    />
                  </div>
                  <span className="text-xs font-black text-ink w-8 text-right tabular-nums">
                    {count}
                  </span>
                </m.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── Error Patterns ─── */}
      {errors.length > 0 && <ErrorPatternSummary errors={errors} />}

      {/* ─── Error Trends ─── */}
      {errors.length > 0 && <ErrorTrendSection errors={errors} />}
    </div>
  );
}
