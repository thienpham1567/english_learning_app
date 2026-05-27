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

const LEVEL_COLORS: Record<string, string> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "magenta",
};

const LEVEL_GLOWS: Record<string, string> = {
  A2: "rgba(16, 185, 129, 0.15)",
  B1: "rgba(59, 130, 246, 0.15)",
  B2: "rgba(139, 92, 246, 0.15)",
  C1: "rgba(236, 72, 153, 0.15)",
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
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const recommendedCategoryId = categories.find((cat) =>
    cat.topics.some((topic) => topic.id === recommendedTopicId),
  )?.id;
  const activeExpandedCategory = expandedCategory ?? recommendedCategoryId;

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat, idx) => {
        const isExpanded = activeExpandedCategory === cat.id;
        const isHovered = hoveredCat === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const progressPct = (completedCount / cat.topics.length) * 100;
        const allDone = completedCount === cat.topics.length && completedCount > 0;

        return (
          <m.div
            key={cat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onMouseEnter={() => setHoveredCat(cat.id)}
            onMouseLeave={() => setHoveredCat(null)}
            className="rounded-xl bg-surface overflow-hidden"
            style={{
              border: isExpanded
                ? `1px solid color-mix(in srgb, ${cat.color} 35%, var(--border))`
                : "1px solid var(--border)",
              boxShadow: isExpanded
                ? `0 10px 30px color-mix(in srgb, ${cat.color} 8%, transparent)`
                : isHovered
                  ? "var(--shadow-md)"
                  : "var(--shadow-sm)",
              transition: "box-shadow 0.25s ease, border-color 0.25s ease",
            }}
          >
            {/* Category header button */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? "__none" : cat.id)}
              className="flex w-full items-center gap-3.5 py-4 px-5 border-none bg-transparent cursor-pointer text-left"
            >
              {/* Icon container with gradient */}
              <div
                className="relative grid w-[46px] h-[46px] rounded-lg text-xl shrink-0"
                style={{
                  placeItems: "center",
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 75%, black))"
                    : `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 75%, black))`,
                  color: "var(--text-on-accent)",
                  boxShadow: `0 4px 12px color-mix(in srgb, ${cat.color} 20%, transparent)`,
                  transition: "transform 0.2s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              >
                {allDone ? <CircleCheckBig /> : cat.icon}
                {/* Completion sparkle */}
                {allDone && (
                  <Star
                    className="absolute text-xs text-(--xp)"
                    style={{ top: -3, right: -3, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
                  />
                )}
              </div>

              <div className="flex-1 w-[0px]">
                <div
                  className="font-extrabold text-text-primary mb-1.5"
                  style={{ fontSize: 14.5, lineHeight: 1.2 }}
                >
                  {cat.title}
                </div>
                {/* Visual progress bar */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex-1 h-[5px] rounded-full relative overflow-hidden"
                    style={{ background: "var(--border)" }}
                  >
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 15 }}
                      className="h-full rounded-full absolute"
                      style={{
                        background: allDone
                          ? "linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 65%, white))"
                          : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 65%, white))`,
                        left: 0,
                        top: 0,
                        bottom: 0,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-extrabold shrink-0 w-[36px] text-right"
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
                className="text-[11px] text-text-muted shrink-0"
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "none",
                  transition: "transform 0.25s ease",
                }}
              />
            </button>

            {/* Expanded topic list using framer-motion for smooth height transition */}
            <m.div
              initial={false}
              animate={{ height: isExpanded ? "auto" : 0 }}
              className="overflow-hidden"
            >
              <div
                className="flex flex-col gap-1.5"
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "12px 16px 16px",
                  background: `color-mix(in srgb, ${cat.color} 4%, var(--surface))`,
                }}
              >
                {cat.topics.map((topic, topicIdx) => {
                  const isDone = completedTopics.has(topic.id);
                  const isTopicHovered = hoveredTopic === topic.id;
                  const progress = progressByTopic[topic.id];
                  const isRecommended = recommendedTopicId === topic.id;

                  return (
                    <m.button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id, topic.title, topic.level)}
                      onMouseEnter={() => setHoveredTopic(topic.id)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      whileHover={{ scale: 1.005, x: 2 }}
                      whileTap={{ scale: 0.995 }}
                      className="flex w-full items-center gap-3 rounded-lg cursor-pointer text-left"
                      style={{
                        padding: "10px 14px",
                        border: isRecommended
                          ? "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                          : "1.5px solid transparent",
                        background: isRecommended
                          ? "var(--accent-light)"
                          : isTopicHovered
                            ? isDone
                              ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                              : "var(--surface-alt)"
                            : isDone
                              ? `color-mix(in srgb, ${cat.color} 5%, transparent)`
                              : "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {/* Step index circle */}
                      <span
                        className="w-[26px] h-[26px] rounded-full grid shrink-0 font-extrabold"
                        style={{
                          placeItems: "center",
                          background: isDone ? cat.color : "var(--surface-alt)",
                          border: isDone ? "none" : "1px solid var(--border)",
                          color: isDone ? "var(--text-on-accent)" : "var(--text-secondary)",
                          fontSize: isDone ? 11 : 11.5,
                        }}
                      >
                        {isDone ? <CircleCheckBig /> : topicIdx + 1}
                      </span>

                      <span
                        className="flex-1"
                        style={{
                          fontSize: 13.5,
                          color: isDone ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: isDone || isRecommended ? 800 : 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {topic.title}
                      </span>

                      {progress && progress.totalCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`m-0 text-[10.5px] rounded-md font-bold border-none py-0.5 px-2 ${
                                progress.scorePct >= 80
                                  ? "bg-emerald-500/15 text-emerald-600"
                                  : progress.scorePct >= 50
                                    ? "bg-amber-500/15 text-amber-600"
                                    : "bg-red-500/15 text-red-600"
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
                        <span
                          className="m-0 text-[10px] rounded-md font-extrabold border-none py-0.5 px-2 bg-amber-500/15 text-amber-600 inline-flex items-center gap-1 shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                        >
                          <Star size={9} />
                          RECOMMENDED
                        </span>
                      )}

                      <span
                        className="m-0 text-[10.5px] rounded-md font-extrabold border-none py-0.5 px-2"
                        style={{
                          background: LEVEL_GLOWS[topic.level] ?? "var(--surface-alt)",
                          color: `var(--${LEVEL_COLORS[topic.level]})`,
                        }}
                      >
                        {topic.level}
                      </span>

                      <ChevronRight
                        className="text-[9px] text-text-muted"
                        style={{ opacity: isTopicHovered ? 1 : 0, transition: "opacity 0.15s" }}
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
