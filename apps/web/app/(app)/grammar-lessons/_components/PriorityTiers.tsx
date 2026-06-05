"use client";

import { CheckCircle, ChevronRight, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  type GrammarPoint,
  type PriorityTier,
  getTierTopicIds,
  PRIORITY_TIERS,
} from "@/lib/grammar-lessons/priority-roadmap";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import { GRAMMAR_TOPIC_CATEGORIES, type GrammarTopic } from "@/lib/grammar-lessons/topics";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type TopicSelection = {
  id: string;
  title: string;
  level: string;
  focusNote?: string;
};

type Props = {
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
  progressByTopic: Record<string, GrammarLessonProgressItem>;
  onSelectTopic: (selection: TopicSelection) => void;
};

const ALL_TOPICS: GrammarTopic[] = GRAMMAR_TOPIC_CATEGORIES.flatMap((c) => c.topics);

function categoryTopics(categoryId: string): GrammarTopic[] {
  return (
    GRAMMAR_TOPIC_CATEGORIES.find((c) => c.id === categoryId)?.topics.filter((t) =>
      t.exams.includes("toeic"),
    ) ?? []
  );
}

export function PriorityTiers({ completedTopics, inProgressTopics, onSelectTopic }: Props) {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [expandedTier, setExpandedTier] = useState<string | null>("high");

  // ── Desktop: Kanban board ──
  if (isDesktop) {
    return (
      <div className="grid grid-cols-3 gap-4 items-start">
        {PRIORITY_TIERS.map((tier, colIdx) => (
          <TierColumn
            key={tier.id}
            tier={tier}
            colIdx={colIdx}
            completedTopics={completedTopics}
            inProgressTopics={inProgressTopics}
            onSelectTopic={onSelectTopic}
          />
        ))}
      </div>
    );
  }

  // ── Mobile / Tablet: Accordion (original behavior) ──
  return (
    <div className="flex flex-col gap-4">
      {PRIORITY_TIERS.map((tier) => {
        const topicIds = getTierTopicIds(tier);
        const completed = topicIds.filter((id) => completedTopics.has(id)).length;
        const pct = topicIds.length > 0 ? Math.round((completed / topicIds.length) * 100) : 0;
        const isOpen = expandedTier === tier.id;

        return (
          <div
            key={tier.id}
            className="bg-surface rounded-xl overflow-hidden border-2 border-border"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <button
              type="button"
              onClick={() => setExpandedTier(isOpen ? null : tier.id)}
              className="w-full border-none bg-transparent cursor-pointer flex items-center gap-4 text-left py-5 px-6 hover:bg-surface-hover"
            >
              <div className="text-xl shrink-0">{tier.stars}</div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black text-ink font-display">{tier.title}</div>
                <div className="text-xs text-text-muted font-semibold mt-0.5">{tier.subtitle}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black font-display" style={{ color: tier.color }}>
                  {pct}%
                </div>
                <div className="text-[11px] text-text-muted font-bold">
                  {completed}/{topicIds.length}
                </div>
              </div>
              <m.div animate={{ rotate: isOpen ? 90 : 0 }} className="text-text-muted shrink-0">
                <ChevronRight />
              </m.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2.5 px-6 pb-6">
                    {tier.points.map((point) => (
                      <PointRow
                        key={point.id}
                        point={point}
                        tierColor={tier.color}
                        completedTopics={completedTopics}
                        inProgressTopics={inProgressTopics}
                        onSelectTopic={onSelectTopic}
                      />
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Desktop Kanban Column — one per priority tier
   ──────────────────────────────────────────────────────────────────────── */

function TierColumn({
  tier,
  colIdx,
  completedTopics,
  inProgressTopics,
  onSelectTopic,
}: {
  tier: PriorityTier;
  colIdx: number;
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
  onSelectTopic: (selection: TopicSelection) => void;
}) {
  const topicIds = getTierTopicIds(tier);
  const completed = topicIds.filter((id) => completedTopics.has(id)).length;
  const pct = topicIds.length > 0 ? Math.round((completed / topicIds.length) * 100) : 0;

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: colIdx * 0.08 }}
      className="flex flex-col rounded-xl border-2 border-border bg-surface overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* ── Column header ── */}
      <div
        className="p-4 border-b-2 border-border"
        style={{
          background: `color-mix(in srgb, ${tier.color} 6%, var(--surface))`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg shrink-0">{tier.stars}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-ink font-display leading-tight">
              {tier.title}
            </div>
            <div className="text-[11px] text-text-muted font-semibold mt-0.5">{tier.subtitle}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5 mt-3">
          <div className="flex-1 h-[5px] rounded-full bg-border relative overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 + colIdx * 0.1 }}
              className="absolute left-0 top-0 bottom-0 h-full rounded-full"
              style={{ background: tier.color }}
            />
          </div>
          <span
            className="text-xs font-black shrink-0 tabular-nums font-mono"
            style={{ color: pct > 0 ? tier.color : "var(--text-muted)" }}
          >
            {completed}/{topicIds.length}
          </span>
        </div>
      </div>

      {/* ── Column body — scrollable list of point cards ── */}
      <div className="flex flex-col gap-2 p-3 max-h-[calc(100vh-320px)] overflow-y-auto">
        {tier.points.map((point, idx) => (
          <m.div
            key={point.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.03 }}
          >
            <PointRow
              point={point}
              tierColor={tier.color}
              completedTopics={completedTopics}
              inProgressTopics={inProgressTopics}
              onSelectTopic={onSelectTopic}
            />
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Shared Point Row — used in both accordion and kanban modes
   ──────────────────────────────────────────────────────────────────────── */

function PointRow({
  point,
  tierColor,
  completedTopics,
  inProgressTopics,
  onSelectTopic,
}: {
  point: GrammarPoint;
  tierColor: string;
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
  onSelectTopic: (selection: TopicSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDirect = point.ref.kind === "direct";

  const subTopics = isDirect
    ? []
    : categoryTopics((point.ref as { categoryId: string }).categoryId);
  const directDone = point.ref.kind === "direct" && completedTopics.has(point.ref.topicId);
  const directInProg = point.ref.kind === "direct" && inProgressTopics.has(point.ref.topicId);
  const expandDone =
    !isDirect && subTopics.length > 0 && subTopics.every((t) => completedTopics.has(t.id));
  const done = directDone || expandDone;
  const inProg = directInProg || (!isDirect && subTopics.some((t) => inProgressTopics.has(t.id)));

  const handleClick = () => {
    if (point.ref.kind === "direct") {
      const topicId = point.ref.topicId;
      const topic = ALL_TOPICS.find((t) => t.id === topicId);
      onSelectTopic({
        id: topicId,
        title: topic?.title ?? point.title,
        level: topic?.level ?? "B1",
        focusNote: point.focusNote,
      });
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <Card bgType="alt" shadowSize="none" size="sm" className="rounded-xl">
      <button
        type="button"
        onClick={handleClick}
        className="w-full border-none bg-transparent cursor-pointer flex items-start gap-3 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {done ? (
            <CheckCircle className="text-success" size={16} />
          ) : inProg ? (
            <Zap className="text-accent" size={16} />
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: tierColor, marginTop: 4, marginLeft: 4, marginRight: 4 }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-ink">{point.title}</div>
          <div className="text-[12px] text-text-secondary font-medium leading-snug mt-0.5">
            {point.focusNote}
          </div>
        </div>
        {!isDirect && (
          <m.div animate={{ rotate: open ? 90 : 0 }} className="text-text-muted shrink-0 mt-0.5">
            <ChevronRight size={16} />
          </m.div>
        )}
      </button>

      {!isDirect && (
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-3">
                {subTopics.map((t) => {
                  const tDone = completedTopics.has(t.id);
                  const tProg = inProgressTopics.has(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() =>
                        onSelectTopic({
                          id: t.id,
                          title: t.title,
                          level: t.level,
                          focusNote: point.focusNote,
                        })
                      }
                      className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold cursor-pointer rounded-xl border border-border bg-surface text-text-secondary hover:border-accent/40"
                    >
                      {tDone ? (
                        <CheckCircle size={11} className="text-success" />
                      ) : tProg ? (
                        <Zap size={11} className="text-accent" />
                      ) : (
                        <span className="text-[8.5px] font-extrabold px-1 py-px rounded bg-border text-text-muted">
                          {t.level}
                        </span>
                      )}
                      <span>{t.title}</span>
                    </button>
                  );
                })}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </Card>
  );
}
