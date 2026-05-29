"use client";

import type { CategoryTrend, TrendInput } from "@repo/modules/learning";
import { computeErrorTrends } from "@repo/modules/learning";
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  HelpCircle,
  Info,
  LineChart,
  Minus,
  TrendingDown,
  TrendingUp,
  Clock,
  Pin,
  MapPin,
  Type,
  Link2,
  Construction,
  Book,
  Puzzle,
  Target,
  PenTool,
  Volume2,
  Headphones,
  Ear,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useMemo } from "react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  tense: Clock,
  article: Pin,
  preposition: MapPin,
  "word-form": Type,
  "subject-verb": Link2,
  clause: Construction,
  vocabulary: Book,
  coherence: Puzzle,
  "task-response": Target,
  spelling: PenTool,
  pronunciation: Volume2,
  "listening-detail": Headphones,
  "listening-comprehension": Ear,
  "reading-comprehension": BookOpen,
  "exam-strategy": GraduationCap,
  other: HelpCircle,
};

type Props = {
  errors: TrendInput[];
};

const DIRECTION_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; label: string; bg: string }
> = {
  improved: {
    icon: <ArrowDown className="h-2.5 w-2.5" />,
    color: "var(--success)",
    bg: "var(--success-bg)",
    label: "Improved",
  },
  worsened: {
    icon: <ArrowUp className="h-2.5 w-2.5" />,
    color: "var(--error)",
    bg: "var(--error-bg)",
    label: "Worsening",
  },
  stable: {
    icon: <Minus className="h-2.5 w-2.5" />,
    color: "var(--text-muted)",
    bg: "var(--bg-deep)",
    label: "Stable",
  },
  new: {
    icon: <HelpCircle className="h-2.5 w-2.5" />,
    color: "var(--warning)",
    bg: "color-mix(in srgb, var(--warning) 10%, var(--surface))",
    label: "New",
  },
};

function TrendRow({ trend }: { trend: CategoryTrend }) {
  const config = DIRECTION_CONFIG[trend.direction]!;
  const pctResolved = Math.round(trend.resolutionRate * 100);
  const IconComponent = CATEGORY_ICONS[trend.category.key] || HelpCircle;

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border-2 border-border transition-all duration-150 hover:shadow-sm">
      <span className="shrink-0 w-7 h-7 rounded-lg bg-accent/5 grid place-items-center text-accent">
        <IconComponent className="h-4 w-4" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-ink">{trend.category.label}</span>
          {!trend.confident && (
            <span className="relative group">
              <Info className="h-3 w-3 text-text-muted cursor-help" />
              <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-ink text-white text-[10px] font-medium whitespace-nowrap z-50 shadow-lg">
                More data needed for an accurate assessment
              </span>
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted leading-snug mt-0.5">{trend.explanation}</div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
          style={{ color: config.color, background: config.bg }}
        >
          {config.icon} {config.label}
        </span>
        <span className="text-[10px] text-text-muted">{pctResolved}% resolved</span>
      </div>
    </div>
  );
}

export function ErrorTrendSection({ errors }: Props) {
  const trends = useMemo(() => computeErrorTrends(errors), [errors]);
  if (!trends.hasData) return null;

  const sections: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    items: CategoryTrend[];
    color: string;
  }> = [
    {
      key: "worsened",
      icon: <TrendingUp className="h-3 w-3" />,
      label: "Needs Attention",
      items: trends.worsened,
      color: "var(--error)",
    },
    {
      key: "improved",
      icon: <TrendingDown className="h-3 w-3" />,
      label: "Improved",
      items: trends.improved,
      color: "var(--success)",
    },
    {
      key: "needsReview",
      icon: <BarChart2 className="h-3 w-3" />,
      label: "Needs Review",
      items: trends.needsReview,
      color: "var(--text-muted)",
    },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-[3px] h-3.5 rounded-sm bg-text-muted shrink-0" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-secondary flex items-center gap-1.5">
          <LineChart className="h-3 w-3" /> Error Trends
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.key}>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-bold mb-1.5"
              style={{ color: section.color }}
            >
              {section.icon} {section.label}
            </div>
            <div className="flex flex-col gap-1.5">
              {section.items.slice(0, 3).map((trend) => (
                <TrendRow key={trend.category.key} trend={trend} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
