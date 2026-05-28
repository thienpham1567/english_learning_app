"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Flame,
  GitBranch,
  Globe,
  HelpCircle,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { QuickLinkCard } from "@/components/shared/QuickLinkCard";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import {
  type GrammarTopic,
  type GrammarTopicCategory,
  getCategoriesForExam,
} from "@/lib/grammar-lessons/topics";

// ── Progress response from API ──
type ProgressResponse = {
  progress: GrammarLessonProgressItem[];
  summary: {
    totalTopics: number;
    totalCompleted: number;
    completedTopicIds: string[];
    progressByTopic: Record<string, GrammarLessonProgressItem>;
  };
  recommendedTopic: GrammarTopic | null;
};

// ── Phase mapping — TOEIC expert roadmap ──
// As someone who scored 900 L&R, this is the strategic learning order
const PHASE_CONFIG = [
  {
    id: 1,
    title: "Grammar Foundation",
    sub: "Build your grammar roots — essential foundation before touching Part 5/6",
    color: "var(--success)",
    gradient: "linear-gradient(135deg, var(--success), #10b981)",
    emoji: "🌱",
    categoryIds: ["tenses", "subject-verb-agreement", "parts-of-speech", "determiners", "pronouns"],
    tip: "This stage determines 70% of your Part 5 score. Don't skip it!",
  },
  {
    id: 2,
    title: "Advanced Structures",
    sub: "Master advanced structures — the key to exceeding 700+ points",
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, #6d28d9, #7c3aed)",
    emoji: "⚡",
    categoryIds: ["modals", "prepositions", "conjunctions", "conditionals", "comparatives"],
    tip: "This is where 600-point and 800-point scorers begin to diverge.",
  },
  {
    id: 3,
    title: "Conquering 800–900",
    sub: "Complex sentence structures & practical exam strategies",
    color: "var(--error)",
    gradient: "linear-gradient(135deg, var(--error), #f97316)",
    emoji: "🔥",
    categoryIds: ["gerunds-infinitives", "passive", "clauses"],
    tip: "This is the time to practice with real exams to verify your knowledge.",
  },
];

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  tenses: <GitBranch />,
  "subject-verb-agreement": <ShieldCheck />,
  "parts-of-speech": <Wrench />,
  determiners: <Globe />,
  pronouns: <HelpCircle />,
  modals: <Zap />,
  prepositions: <Target />,
  conjunctions: <Lightbulb />,
  conditionals: <Flame />,
  comparatives: <Star />,
  "gerunds-infinitives": <Rocket />,
  passive: <BookOpen />,
  clauses: <Trophy />,
};

// ── Main Page ────────────────────────────────────────────
export default function GrammarRoadmapPage() {
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  // Load progress
  useEffect(() => {
    let cancelled = false;
    api
      .get<ProgressResponse>("/grammar-lessons/progress", { params: { examMode: "toeic" } })
      .then((data) => {
        if (cancelled) return;
        setProgressByTopic(data.summary.progressByTopic);
        setRecommendedTopic(data.recommendedTopic);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // All TOEIC categories
  const allCategories = useMemo(() => getCategoriesForExam("toeic"), []);

  // Computed stats
  const completedSet = useMemo(
    () =>
      new Set(
        Object.values(progressByTopic)
          .filter((p) => p.status === "completed")
          .map((p) => p.topicId),
      ),
    [progressByTopic],
  );

  const inProgressSet = useMemo(
    () =>
      new Set(
        Object.values(progressByTopic)
          .filter((p) => p.status === "in_progress")
          .map((p) => p.topicId),
      ),
    [progressByTopic],
  );

  const totalTopics = allCategories.reduce((s, c) => s + c.topics.length, 0);
  const totalCompleted = completedSet.size;
  const totalInProgress = inProgressSet.size;
  const overallPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  // Phase stats
  const getPhaseStats = useCallback(
    (categoryIds: string[]) => {
      const cats = allCategories.filter((c) => categoryIds.includes(c.id));
      const topics = cats.flatMap((c) => c.topics);
      const completed = topics.filter((t) => completedSet.has(t.id)).length;
      const inProg = topics.filter((t) => inProgressSet.has(t.id)).length;
      return {
        total: topics.length,
        completed,
        inProgress: inProg,
        pct: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0,
      };
    },
    [allCategories, completedSet, inProgressSet],
  );

  // Determine current phase for the user
  const currentPhase = useMemo(() => {
    for (let i = 0; i < PHASE_CONFIG.length; i++) {
      const stats = getPhaseStats(PHASE_CONFIG[i].categoryIds);
      if (stats.pct < 100) return i + 1;
    }
    return 3; // All done
  }, [getPhaseStats]);

  return (
    <div className="anim-fade-up h-full overflow-y-auto p-6">
      <div className="w-full max-w-[900px] mx-auto">
        {/* ── Overall Progress Card ── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card shadowSize="md" className="mt-5 mb-6 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, var(--success), var(--accent), var(--error))",
              }}
            />

            <div className="flex items-center gap-5 flex-wrap">
              {/* Custom SVG circle progress */}
              <div className="relative w-[90px] h-[90px] shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallPct * 2.64} 264`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-ink font-display">{overallPct}%</span>
                  <span className="text-[9.5px] font-bold text-text-muted">Completed</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 min-w-[200px]">
                <div className="text-lg font-black text-ink font-display mb-1">
                  Overall Progress
                </div>
                <div className="flex gap-4 flex-wrap mb-3">
                  <StatPill
                    icon={<CheckCircle className="text-emerald-500" />}
                    label="Completed"
                    value={`${totalCompleted}/${totalTopics}`}
                  />
                  <StatPill
                    icon={<Zap className="text-accent" />}
                    label="In Progress"
                    value={String(totalInProgress)}
                  />
                  <StatPill
                    icon={<Flame className="text-destructive" />}
                    label="Phase"
                    value={`${currentPhase}/3`}
                  />
                </div>

                {/* Phase progress mini-bars */}
                <div className="flex gap-1">
                  {PHASE_CONFIG.map((phase) => {
                    const stats = getPhaseStats(phase.categoryIds);
                    return (
                      <div
                        key={phase.id}
                        className="flex-1 h-1.5 overflow-hidden rounded-sm bg-border"
                        title={`${phase.title}: ${stats.completed}/${stats.total} (${stats.pct}%)`}
                      >
                        <div
                          className="h-full rounded-sm transition-[width] duration-500 ease-out"
                          style={{
                            width: `${stats.pct}%`,
                            background: phase.gradient,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended action */}
              {recommendedTopic && (
                <Link
                  href={`/grammar-lessons?topic=${recommendedTopic.id}`}
                  className="no-underline"
                >
                  <Card
                    interactive
                    shadowSize="sm"
                    className="flex flex-row items-center gap-2.5 cursor-pointer w-[200px] py-3.5 px-5 text-[var(--text-on-accent)] border-transparent"
                    style={{
                      background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    }}
                  >
                    <Rocket size={18} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                        Next Recommended Topic
                      </div>
                      <div className="text-sm font-extrabold">{recommendedTopic.title}</div>
                    </div>
                    <ArrowRight className="text-sm ml-auto" />
                  </Card>
                </Link>
              )}
            </div>
          </Card>
        </m.div>

        {/* ── Phase Accordion ── */}
        <div className="flex flex-col gap-4">
          {PHASE_CONFIG.map((phase, phaseIdx) => {
            const stats = getPhaseStats(phase.categoryIds);
            const isExpanded = expandedPhase === phase.id;
            const phaseCats = allCategories.filter((c) => phase.categoryIds.includes(c.id));
            const isCurrentPhase = currentPhase === phase.id;
            const isPastPhase = currentPhase > phase.id;

            return (
              <m.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + phaseIdx * 0.1 }}
                className={`bg-surface rounded-xl overflow-hidden ${
                  isCurrentPhase ? "border-2" : "border border-border"
                }`}
                style={{
                  borderColor: isCurrentPhase ? phase.color : undefined,
                  boxShadow: isCurrentPhase
                    ? `0 6px 24px color-mix(in srgb, ${phase.color} 12%, transparent)`
                    : "var(--shadow-sm)",
                }}
              >
                {/* Phase Header (clickable) */}
                <m.button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  whileHover={{ backgroundColor: "var(--surface-hover)" }}
                  className="w-full border-none bg-transparent cursor-pointer flex items-center gap-4 text-left py-5 px-6"
                >
                  {/* Phase number badge */}
                  <div
                    className="w-12 h-12 grid shrink-0 text-2xl rounded-[14px] place-items-center"
                    style={{ background: phase.gradient }}
                  >
                    {isPastPhase ? <CheckCircle className="text-white" /> : phase.emoji}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.12em]"
                        style={{ color: phase.color }}
                      >
                        Phase {String(phase.id).padStart(2, "0")}
                      </span>
                      {isCurrentPhase && (
                        <span
                          className="text-[9px] font-extrabold rounded-md py-0.5 px-2"
                          style={{
                            background: `color-mix(in srgb, ${phase.color} 12%, var(--surface))`,
                            color: phase.color,
                            border: `1px solid color-mix(in srgb, ${phase.color} 25%, transparent)`,
                          }}
                        >
                          LEARNING
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-ink font-display">{phase.title}</div>
                    <div className="text-xs text-text-muted font-semibold mt-0.5">{phase.sub}</div>
                  </div>

                  {/* Phase progress */}
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl font-black font-display"
                      style={{ color: phase.color }}
                    >
                      {stats.pct}%
                    </div>
                    <div className="text-[11px] text-text-muted font-bold">
                      {stats.completed}/{stats.total} topics
                    </div>
                  </div>

                  {/* Chevron */}
                  <m.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    className="text-sm text-text-muted shrink-0"
                  >
                    <ArrowRight />
                  </m.div>
                </m.button>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 px-6 pb-6">
                        {/* Expert tip */}
                        <div
                          className="py-3 px-4 rounded-lg flex items-start gap-2.5"
                          style={{
                            background: `color-mix(in srgb, ${phase.color} 5%, var(--surface-alt))`,
                            border: `1px solid color-mix(in srgb, ${phase.color} 15%, transparent)`,
                          }}
                        >
                          <Lightbulb className="text-base mt-0.5" style={{ color: phase.color }} />
                          <div>
                            <div
                              className="text-[11px] font-extrabold uppercase tracking-wider"
                              style={{ color: phase.color }}
                            >
                              900-Point Scorer Insight
                            </div>
                            <div className="text-[13px] text-text-secondary font-semibold leading-normal mt-0.5">
                              {phase.tip}
                            </div>
                          </div>
                        </div>

                        {/* Categories */}
                        {phaseCats.map((cat, catIdx) => (
                          <CategoryCard
                            key={cat.id}
                            category={cat}
                            completedSet={completedSet}
                            inProgressSet={inProgressSet}
                            delay={catIdx * 0.05}
                            phaseColor={phase.color}
                          />
                        ))}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            );
          })}
        </div>

        {/* ── Expert Tips Section ── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card shadowSize="sm" className="mt-6">
            <div className="text-base font-black text-ink font-display mb-4 flex items-center gap-2">
              <Trophy className="text-[var(--xp)]" />
              Strategies from a 900 L&R Scorer
            </div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              {[
                {
                  emoji: "🎯",
                  title: "Part 5: 20 Seconds/Question",
                  desc: "Identify parts of speech first, eliminating 2 choices instantly. 80% of Part 5 tests parts of speech, tenses, or subject-verb agreement.",
                },
                {
                  emoji: "📚",
                  title: "Learn in Opposing Pairs",
                  desc: "Always learn Because vs Because of, Although vs Despite together. TOEIC loves testing the difference between conjunctions and prepositions.",
                },
                {
                  emoji: "🔁",
                  title: "Spaced Repetition Practice",
                  desc: "After each lesson, our AI generates 4-tier exercises: recognition → application → active writing → exam context.",
                },
                {
                  emoji: "⚡",
                  title: "Don't Overlook Passive Voice",
                  desc: "10-15% of Part 5/6 tests passive voice. Mastering be + V3 and causative structures (have something done) guarantees quick points.",
                },
              ].map((tip, i) => (
                <Card key={i} shadowSize="sm" size="sm" bgType="alt">
                  <div className="text-xl mb-1.5">{tip.emoji}</div>
                  <div className="font-extrabold text-ink mb-1 text-[13.5px]">{tip.title}</div>
                  <div className="text-xs text-text-secondary leading-normal font-medium">
                    {tip.desc}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </m.div>

        {/* Quick links */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2.5 mt-5 flex-wrap mb-10"
        >
          <QuickLinkCard
            href="/grammar-lessons"
            emoji="📖"
            label="Lesson Library"
            desc="50+ AI-generated topics"
            className="flex-[1_1_200px]"
          />
          <QuickLinkCard
            href="/grammar-quiz"
            emoji="📝"
            label="Part 5 Quiz"
            desc="Real exam practice"
            className="flex-[1_1_200px]"
          />
          <QuickLinkCard
            href="/toeic/grammar/drill"
            emoji="🎯"
            label="Grammar Drill"
            desc="Target weak areas"
            className="flex-[1_1_200px]"
          />
          <QuickLinkCard
            href="/toeic/practice"
            emoji="🏆"
            label="TOEIC Practice"
            desc="Full test practice"
            className="flex-[1_1_200px]"
          />
        </m.div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function CategoryCard({
  category,
  completedSet,
  inProgressSet,
  delay,
  phaseColor,
}: {
  category: GrammarTopicCategory;
  completedSet: Set<string>;
  inProgressSet: Set<string>;
  delay: number;
  phaseColor: string;
}) {
  const completed = category.topics.filter((t) => completedSet.has(t.id)).length;
  const pct =
    category.topics.length > 0 ? Math.round((completed / category.topics.length) * 100) : 0;
  const icon = CATEGORY_ICONS[category.id] ?? <BookOpen />;

  return (
    <m.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <Card shadowSize="sm" size="sm" bgType="alt">
        {/* Category header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 grid text-[15px] shrink-0 rounded-[10px] place-items-center"
            style={{
              background: `color-mix(in srgb, ${category.color} 10%, var(--surface))`,
              color: category.color,
            }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-ink">{category.title}</div>
            <div className="text-[11px] text-text-muted font-semibold">
              {completed}/{category.topics.length} · {pct}%
            </div>
          </div>
          <div className="w-[60px]">
            <div className="h-[5px] rounded-sm bg-border">
              <div
                className="h-full rounded-sm transition-[width] duration-400 ease-out"
                style={{
                  width: `${pct}%`,
                  background: category.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Topic chips */}
        <div className="flex flex-wrap gap-1.5">
          {category.topics.map((topic) => {
            const isDone = completedSet.has(topic.id);
            const isInProg = inProgressSet.has(topic.id);

            return (
              <Link
                key={topic.id}
                href={`/grammar-lessons?topic=${topic.id}`}
                className="no-underline"
              >
                <m.div
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-[5px] py-1.5 px-3 text-xs font-bold cursor-pointer rounded-[10px] transition-all duration-150"
                  style={{
                    border: isDone
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : isInProg
                        ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                        : "1px solid var(--border)",
                    background: isDone
                      ? "rgba(16, 185, 129, 0.06)"
                      : isInProg
                        ? "color-mix(in srgb, var(--accent) 5%, var(--surface))"
                        : "var(--surface)",
                    color: isDone
                      ? "var(--success)"
                      : isInProg
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                  }}
                >
                  {isDone ? (
                    <CheckCircle className="text-[11px] text-emerald-500" />
                  ) : isInProg ? (
                    <Zap className="text-[11px] text-accent" />
                  ) : (
                    <span
                      className="font-extrabold rounded text-[8.5px] py-px px-1"
                      style={{
                        background:
                          topic.level === "A2"
                            ? "rgba(16, 185, 129, 0.1)"
                            : topic.level === "B1"
                              ? "rgba(59, 130, 246, 0.1)"
                              : "rgba(245, 158, 11, 0.1)",
                        color:
                          topic.level === "A2"
                            ? "var(--success)"
                            : topic.level === "B1"
                              ? "var(--info)"
                              : "var(--warning)",
                      }}
                    >
                      {topic.level}
                    </span>
                  )}
                  <span>{topic.title}</span>
                </m.div>
              </Link>
            );
          })}
        </div>
      </Card>
    </m.div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-text-muted font-semibold">{label}:</span>
      <span className="text-[13px] font-extrabold text-ink">{value}</span>
    </div>
  );
}
