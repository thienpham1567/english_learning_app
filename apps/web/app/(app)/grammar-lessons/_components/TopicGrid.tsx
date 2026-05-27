"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlignVerticalSpaceAround,
  ArrowLeftRight,
  CheckSquare,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Clock,
  FileText,
  Lightbulb,
  Link as LinkIcon,
  MapPin,
  Network,
  Percent,
  Pin,
  RefreshCw,
  Square,
  Star,
  Type,
  User,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import {
  type ExamType,
  GRAMMAR_TOPIC_CATEGORIES,
  type GrammarTopic,
  type GrammarTopicCategory,
  getCategoriesForExam,
} from "@/lib/grammar-lessons/topics";

export type { GrammarTopic };

export type GrammarCategory = GrammarTopicCategory & {
  icon: ReactNode;
};

const CATEGORY_ICONS: Record<string, ReactNode> = {
  tenses: <Clock />,
  "subject-verb-agreement": <CheckSquare />,
  "parts-of-speech": <Type />,
  modals: <Lightbulb />,
  prepositions: <MapPin />,
  conjunctions: <Network />,
  conditionals: <ArrowLeftRight />,
  comparatives: <Percent />,
  "gerunds-infinitives": <FileText />,
  passive: <RefreshCw />,
  pronouns: <User />,
  clauses: <LinkIcon />,
  determiners: <Pin />,
  "complex-sentences": <Square />,
  inversion: <AlignVerticalSpaceAround />,
  nominalization: <ClipboardList />,
  "advanced-structures": <Zap />,
};

function buildCategories(exam?: ExamType): GrammarCategory[] {
  const source = exam ? getCategoriesForExam(exam) : GRAMMAR_TOPIC_CATEGORIES;
  return source.map((category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.id] ?? <Lightbulb />,
  }));
}

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  A2: "bg-success/12 text-success",
  B1: "bg-secondary/12 text-secondary",
  B2: "bg-xp/12 text-xp",
  C1: "bg-error/12 text-error",
};

const EMPTY_PROGRESS_BY_TOPIC: Record<string, GrammarLessonProgressItem> = {};

interface Props {
  onSelectTopic: (topicId: string, topicTitle: string, level: string) => void;
  completedTopics: Set<string>;
  progressByTopic?: Record<string, GrammarLessonProgressItem>;
  recommendedTopicId?: string | null;
  examFilter?: ExamType;
}

export function TopicGrid({
  onSelectTopic,
  completedTopics,
  progressByTopic = EMPTY_PROGRESS_BY_TOPIC,
  recommendedTopicId,
  examFilter,
}: Props) {
  const categories = useMemo(() => buildCategories(examFilter), [examFilter]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const recommendedCategoryId = categories.find((cat) =>
    cat.topics.some((topic) => topic.id === recommendedTopicId),
  )?.id;
  const activeExpandedCategory = expandedCategory ?? recommendedCategoryId;

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat, idx) => {
        const isExpanded = activeExpandedCategory === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const progressPct = (completedCount / cat.topics.length) * 100;
        const allDone = completedCount === cat.topics.length && completedCount > 0;

        return (
          <m.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 25 }}
            className={`rounded-2xl bg-surface overflow-hidden border-2 transition-all duration-200 ${
              isExpanded
                ? "border-accent/30 shadow-md"
                : "border-border shadow-sm hover:shadow-md"
            }`}
          >
            {/* Category header button */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? "__none" : cat.id)}
              className="flex w-full items-center gap-3.5 py-4 px-5 border-none bg-transparent cursor-pointer text-left group"
            >
              {/* Icon container */}
              <div
                className="relative grid w-11 h-11 rounded-xl text-lg shrink-0 place-items-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105 border-2 border-white/10"
                style={{
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 70%, black))"
                    : `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 70%, black))`,
                }}
              >
                {allDone ? <CircleCheckBig size={20} /> : cat.icon}
                {allDone && (
                  <Star
                    size={10}
                    className="absolute -top-1 -right-1 text-xp fill-current drop-shadow-sm"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black text-ink text-[14px] leading-tight mb-1.5 truncate">
                  {cat.title}
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-[5px] rounded-full bg-border relative overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 15 }}
                      className="absolute left-0 top-0 bottom-0 h-full rounded-full"
                      style={{
                        background: allDone
                          ? "linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 65%, white))"
                          : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 65%, white))`,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-black shrink-0 w-9 text-right tabular-nums"
                    style={{
                      color: allDone
                        ? "var(--success)"
                        : completedCount > 0
                          ? cat.color
                          : "var(--text-muted)",
                    }}
                  >
                    {completedCount}/{cat.topics.length}
                  </span>
                </div>
              </div>

              <ChevronRight
                size={16}
                className={`text-text-muted shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Expanded topic list */}
            <m.div
              initial={false}
              animate={{ height: isExpanded ? "auto" : 0 }}
              className="overflow-hidden"
            >
              <div
                className="flex flex-col gap-1.5 border-t-2 border-border p-4"
                style={{
                  background: `color-mix(in srgb, ${cat.color} 3%, var(--surface))`,
                }}
              >
                {cat.topics.map((topic, topicIdx) => {
                  const isDone = completedTopics.has(topic.id);
                  const progress = progressByTopic[topic.id];
                  const isRecommended = recommendedTopicId === topic.id;

                  return (
                    <m.button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id, topic.title, topic.level)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.995 }}
                      className={`flex w-full items-center gap-3 rounded-xl cursor-pointer text-left py-2.5 px-3.5 transition-all duration-150 group/topic border-2 ${
                        isRecommended
                          ? "border-accent/25 bg-accent-light"
                          : isDone
                            ? "border-transparent bg-surface/50 hover:bg-surface"
                            : "border-transparent bg-surface hover:bg-surface-alt"
                      }`}
                    >
                      {/* Step index circle */}
                      <span
                        className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 text-[11px] font-extrabold border-2 transition-all duration-150 ${
                          isDone
                            ? "bg-success text-white border-success/30"
                            : "bg-bg-deep text-text-secondary border-border"
                        }`}
                      >
                        {isDone ? <CircleCheckBig size={13} /> : topicIdx + 1}
                      </span>

                      <span
                        className={`flex-1 text-[13px] leading-snug ${
                          isDone || isRecommended
                            ? "font-bold text-ink"
                            : "font-medium text-text-secondary"
                        }`}
                      >
                        {topic.title}
                      </span>

                      {progress && progress.totalCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`text-[10px] rounded-lg font-bold py-0.5 px-2 ${
                                progress.scorePct >= 80
                                  ? "bg-success/12 text-success"
                                  : progress.scorePct >= 50
                                    ? "bg-warning/12 text-warning"
                                    : "bg-error/12 text-error"
                              }`}
                            >
                              {progress.scorePct >= 90
                                ? "🥇 "
                                : progress.scorePct >= 70
                                  ? "🥈 "
                                  : progress.scorePct >= 50
                                    ? "🥉 "
                                    : ""}
                              {progress.scorePct}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{`Correct answers: ${progress.correctCount}/${progress.totalCount}`}</TooltipContent>
                        </Tooltip>
                      )}

                      {isRecommended && (
                        <span className="text-[9px] rounded-lg font-extrabold py-0.5 px-2 bg-warning/12 text-warning inline-flex items-center gap-1 shadow-[0_0_6px_rgba(245,158,11,0.25)]">
                          <Star size={8} className="fill-current" />
                          REC
                        </span>
                      )}

                      <span
                        className={`text-[10px] rounded-lg font-extrabold py-0.5 px-2 ${
                          LEVEL_BADGE_CLASSES[topic.level] ?? "bg-surface-alt text-text-muted"
                        }`}
                      >
                        {topic.level}
                      </span>

                      <ChevronRight
                        size={12}
                        className="text-text-muted opacity-0 group-hover/topic:opacity-100 transition-opacity duration-150 shrink-0"
                      />
                    </m.button>
                  );
                })}
              </div>
            </m.div>
          </m.div>
        );
      })}
    </div>
  );
}
