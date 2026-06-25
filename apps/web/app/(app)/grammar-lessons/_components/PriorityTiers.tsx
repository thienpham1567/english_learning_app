"use client";

import { ArrowUpRight, Check, ChevronRight, Layers, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useState } from "react";
import {
  type GrammarPoint,
  getTierTopicIds,
  PRIORITY_TIERS,
  type PriorityTier,
} from "@/lib/grammar-lessons/priority-roadmap";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import { GRAMMAR_TOPIC_CATEGORIES, type GrammarTopic } from "@/lib/grammar-lessons/topics";

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

/** Two-digit, zero-padded ordinal used in the syllabus gutter. */
function ord(n: number): string {
  return String(n + 1).padStart(2, "0");
}

/* ────────────────────────────────────────────────────────────────────────
   PriorityTiers — "THE PROGRAM": a vertical, editorial grammar syllabus.
   Each priority tier is a numbered section; each point is an oversized row
   with a ghost ordinal in the gutter and a monospace focus note.
   ──────────────────────────────────────────────────────────────────────── */
export function PriorityTiers({ completedTopics, inProgressTopics, onSelectTopic }: Props) {
  return (
    <div className="flex flex-col gap-7">
      {PRIORITY_TIERS.map((tier, tierIdx) => (
        <TierSection
          key={tier.id}
          tier={tier}
          tierIdx={tierIdx}
          completedTopics={completedTopics}
          inProgressTopics={inProgressTopics}
          onSelectTopic={onSelectTopic}
        />
      ))}
    </div>
  );
}

/* ── One priority tier rendered as a numbered program section ── */
function TierSection({
  tier,
  tierIdx,
  completedTopics,
  inProgressTopics,
  onSelectTopic,
}: {
  tier: PriorityTier;
  tierIdx: number;
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
  onSelectTopic: (selection: TopicSelection) => void;
}) {
  const topicIds = getTierTopicIds(tier);
  const completed = topicIds.filter((id) => completedTopics.has(id)).length;
  const pct = topicIds.length > 0 ? Math.round((completed / topicIds.length) * 100) : 0;

  return (
    <m.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tierIdx * 0.08, type: "spring", stiffness: 260, damping: 26 }}
    >
      {/* ── Section masthead ── */}
      <div className="flex items-end justify-between gap-4 pb-2.5">
        <div className="flex items-center gap-4 min-w-0">
          {/* Program number block */}
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border font-display text-lg font-bold text-white shadow"
            style={{ background: tier.color }}
          >
            {ord(tierIdx)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              <span>Program {ord(tierIdx)}</span>
              <span aria-hidden>{tier.stars}</span>
            </div>
            <h3 className="m-0 truncate font-display text-xl font-bold leading-tight text-ink">
              {tier.title}
            </h3>
          </div>
        </div>

        {/* Tier ratio */}
        <div className="shrink-0 text-right">
          <div
            className="font-display text-2xl font-bold leading-none tabular-nums"
            style={{ color: pct > 0 ? tier.color : "var(--text-muted)" }}
          >
            {completed}
            <span className="text-text-muted">/{topicIds.length}</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {tier.subtitle}
          </div>
        </div>
      </div>

      {/* Heavy section rule with a fill segment */}
      <div className="relative mb-3 h-1.5 w-full rounded-full border border-border bg-surface overflow-hidden">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.15 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: tier.color }}
        />
      </div>

      {/* ── Points: bordered syllabus table with a numbered gutter ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
        {tier.points.map((point, idx) => (
          <PointRow
            key={point.id}
            point={point}
            index={idx}
            isLast={idx === tier.points.length - 1}
            tierColor={tier.color}
            completedTopics={completedTopics}
            inProgressTopics={inProgressTopics}
            onSelectTopic={onSelectTopic}
          />
        ))}
      </div>
    </m.section>
  );
}

/* ── One syllabus row — either a direct lesson or an expandable group ── */
function PointRow({
  point,
  index,
  isLast,
  tierColor,
  completedTopics,
  inProgressTopics,
  onSelectTopic,
}: {
  point: GrammarPoint;
  index: number;
  isLast: boolean;
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

  // For group points, a small "x/y" of sub-topics done.
  const subDone = subTopics.filter((t) => completedTopics.has(t.id)).length;

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

  // Status drives the ordinal's treatment: solid when touched, ghost-outline otherwise.
  const numberStyle = done
    ? { color: "var(--success)" }
    : inProg
      ? { color: tierColor }
      : {
          color: "transparent",
          WebkitTextStroke: "1.5px var(--border)",
        };

  return (
    <div className={isLast ? "" : "border-b-2 border-border"}>
      <button
        type="button"
        onClick={handleClick}
        className="group/row grid w-full grid-cols-[60px_1fr_auto] items-stretch border-none bg-transparent text-left transition-colors hover:bg-surface-hover sm:grid-cols-[76px_1fr_auto]"
      >
        {/* Gutter ordinal */}
        <div className="relative grid place-items-center border-r-2 border-border py-4">
          <span
            className="select-none font-display text-3xl font-bold leading-none tabular-nums sm:text-4xl"
            style={numberStyle}
          >
            {ord(index)}
          </span>
          {done && (
            <span className="absolute right-1 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-success text-white">
              <Check size={11} strokeWidth={3.5} />
            </span>
          )}
        </div>

        {/* Title + focus note */}
        <div className="flex min-w-0 flex-col justify-center gap-1 py-3.5 pl-4 pr-3">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-[15px] font-bold leading-tight text-ink">
              {point.title}
            </span>
            {!isDirect && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-bg-deep px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                <Layers size={9} />
                {subTopics.length}
              </span>
            )}
          </div>
          <p className="m-0 flex items-start gap-1.5 font-mono text-[11.5px] font-medium leading-snug text-text-secondary">
            <span className="mt-px shrink-0" style={{ color: tierColor }} aria-hidden>
              ▶
            </span>
            <span className="line-clamp-2">{point.focusNote}</span>
          </p>
        </div>

        {/* Right meta column */}
        <div className="flex items-center gap-2.5 pr-3.5 sm:pr-5">
          {inProg && !done && (
            <span className="hidden items-center gap-1 rounded-md border border-accent/30 bg-accent-light px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-accent-active sm:inline-flex">
              <Zap size={10} className="fill-current" />
              Đang học
            </span>
          )}
          {!isDirect && (
            <span
              className="hidden font-mono text-[10px] font-bold tabular-nums text-text-muted sm:inline"
              aria-hidden
            >
              {subDone}/{subTopics.length}
            </span>
          )}
          {isDirect ? (
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-ink shadow-sm transition-transform group-hover/row:-translate-x-0.5 group-hover/row:-translate-y-0.5">
              <ArrowUpRight size={15} />
            </span>
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-ink">
              <m.span animate={{ rotate: open ? 90 : 0 }} className="grid place-items-center">
                <ChevronRight size={15} />
              </m.span>
            </span>
          )}
        </div>
      </button>

      {/* Expandable module grid */}
      {!isDirect && (
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="overflow-hidden border-t-2 border-dashed border-border bg-bg-deep"
            >
              <div className="flex flex-col gap-2.5 px-4 py-4 sm:pl-[76px]">
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Modules · {subTopics.length}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        className="group/mod flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow active:translate-x-0 active:translate-y-0 active:shadow-sm"
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border border-border font-mono text-[8px] font-bold ${
                            tDone
                              ? "bg-success text-white"
                              : tProg
                                ? "bg-accent text-text-on-accent"
                                : "bg-bg-deep text-text-muted"
                          }`}
                        >
                          {tDone ? <Check size={10} strokeWidth={3.5} /> : t.level}
                        </span>
                        <span className="flex-1 truncate text-[12.5px] font-bold text-ink">
                          {t.title}
                        </span>
                        <ArrowUpRight
                          size={13}
                          className="shrink-0 text-text-muted transition-transform group-hover/mod:-translate-y-0.5 group-hover/mod:translate-x-0.5"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
