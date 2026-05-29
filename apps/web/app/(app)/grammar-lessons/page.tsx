"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Flame,
  Rocket,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonView } from "@/app/(app)/grammar-lessons/_components/LessonView";
import { TopicGrid } from "@/app/(app)/grammar-lessons/_components/TopicGrid";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { QuickLinkCard } from "@/components/shared/QuickLinkCard";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import type { ExamType, GrammarTopic } from "@/lib/grammar-lessons/topics";
import { getCategoriesForExam } from "@/lib/grammar-lessons/topics";

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

export default function GrammarLessonsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<{
    id: string;
    title: string;
    level: string;
  } | null>(null);
  const examTab: ExamType = "toeic";
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>(
    {},
  );
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const completedTopics = useMemo(
    () =>
      new Set(
        Object.values(progressByTopic)
          .filter((item) => item.status === "completed")
          .map((item) => item.topicId),
      ),
    [progressByTopic],
  );

  const inProgressTopics = useMemo(
    () =>
      new Set(
        Object.values(progressByTopic)
          .filter((item) => item.status === "in_progress")
          .map((item) => item.topicId),
      ),
    [progressByTopic],
  );

  const tabStats = useMemo(() => {
    const cats = getCategoriesForExam(examTab);
    const totalTopics = cats.reduce((sum, c) => sum + c.topics.length, 0);
    const completed = cats.reduce(
      (sum, c) => sum + c.topics.filter((t) => completedTopics.has(t.id)).length,
      0,
    );
    return { totalTopics, completed, categories: cats.length };
  }, [examTab, completedTopics]);

  const refreshProgress = useCallback(async () => {
    try {
      const data = await api.get<ProgressResponse>("/grammar-lessons/progress", {
        params: { examMode },
      });
      setProgressByTopic(data.summary.progressByTopic);
      setRecommendedTopic(data.recommendedTopic);
      setProgressError(null);
    } catch {
      setProgressError("Failed to load learning progress.");
    }
  }, [examMode]);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ProgressResponse>("/grammar-lessons/progress", {
        params: { examMode },
      })
      .then((data) => {
        if (cancelled) return;
        setProgressByTopic(data.summary.progressByTopic);
        setRecommendedTopic(data.recommendedTopic);
        setProgressError(null);
      })
      .catch(() => {
        if (!cancelled) setProgressError("Failed to load learning progress.");
      });

    return () => {
      cancelled = true;
    };
  }, [examMode]);

  const progressPct =
    tabStats.totalTopics > 0 ? Math.round((tabStats.completed / tabStats.totalTopics) * 100) : 0;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Content area */}
      <div className="relative flex-1 overflow-y-auto z-[1] p-5">
        {/* Soft ambient glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in_srgb,var(--accent)_5%,transparent),transparent_70%)]" />

        <div className={`relative mx-auto w-full ${activeTopic ? "max-w-[720px]" : "max-w-6xl"}`}>
          {activeTopic ? (
            <LessonView
              topicId={activeTopic.id}
              topicTitle={activeTopic.title}
              level={activeTopic.level}
              examMode={examMode}
              onBack={() => setActiveTopic(null)}
              onComplete={(topicId, progress) => {
                setProgressByTopic((prev) => ({ ...prev, [topicId]: progress }));
                void refreshProgress();
              }}
            />
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-[340px_1fr] lg:items-start gap-5">
              {/* ── Left sidebar on desktop ── */}
              <div className="flex flex-col gap-5 lg:sticky lg:top-0">

              {/* ── Hero Stats Dashboard ── */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card
                  shadowSize="md"
                  className="rounded-2xl relative overflow-hidden bg-surface p-6"
                >
                  {/* Top accent gradient bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-success" />

                  <div className="flex items-center gap-6 flex-wrap lg:flex-col lg:items-stretch">
                    {/* SVG Circle progress */}
                    <div className="relative w-[88px] h-[88px] shrink-0 lg:mx-auto">
                      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                        <circle
                          cx="44"
                          cy="44"
                          r="38"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="44"
                          cy="44"
                          r="38"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 38}`}
                          strokeDashoffset={`${2 * Math.PI * 38 * (1 - progressPct / 100)}`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-ink font-display">
                          {progressPct}%
                        </div>
                        <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider">
                          Completed
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="flex-1 min-w-[200px] grid grid-cols-3 lg:grid-cols-1 gap-3">
                      <StatCard
                        icon={<BookOpen size={18} />}
                        color="accent"
                        label="Topics"
                        value={`${tabStats.categories} groups`}
                        sub={`${tabStats.totalTopics} lessons`}
                      />
                      <StatCard
                        icon={<CheckCircle size={18} />}
                        color="success"
                        label="Completed"
                        value={`${tabStats.completed}`}
                        sub={`/${tabStats.totalTopics} lessons`}
                      />
                      <StatCard
                        icon={progressPct === 100 ? <Trophy size={18} /> : <Flame size={18} />}
                        color={progressPct === 100 ? "xp" : "fire"}
                        label="In Progress"
                        value={`${inProgressTopics.size}`}
                        sub="topics"
                      />
                    </div>
                  </div>
                </Card>
              </m.div>

              {/* Progress error */}
              {progressError && (
                <div className="flex items-center gap-2.5 rounded-2xl text-xs font-bold py-3 px-4 bg-warning/10 text-warning border-2 border-warning/20">
                  <AlertTriangle size={14} /> {progressError}
                </div>
              )}

              {/* ── Recommended Topic CTA ── */}
              {recommendedTopic && (
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card
                    interactive
                    bgType="transparent"
                    shadowSize="sm"
                    className="w-full rounded-2xl border-2 border-border cursor-pointer flex flex-row items-center gap-4 relative overflow-hidden text-left p-5 bg-accent"
                    onClick={() =>
                      setActiveTopic({
                        id: recommendedTopic.id,
                        title: recommendedTopic.title,
                        level: recommendedTopic.level,
                      })
                    }
                  >
                    {/* Decorative shapes — brutalist geometric */}
                    <div className="absolute -top-6 -right-6 w-[120px] h-[120px] rotate-12 bg-white/[0.08] pointer-events-none" />
                    <div className="absolute -bottom-4 -left-4 w-[80px] h-[80px] -rotate-6 bg-white/[0.05] pointer-events-none" />

                    {/* Icon */}
                    <div className="w-12 h-12 grid shrink-0 rounded-xl bg-white/15 place-items-center border-2 border-white/20">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 relative">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/70 flex items-center gap-1">
                        <Star size={10} className="fill-current" />
                        Recommended Next Lesson
                      </div>
                      <div className="font-black font-display text-[17px] text-white mt-1 leading-tight">
                        {recommendedTopic.title}
                      </div>
                      <div className="text-[11.5px] font-semibold text-white/65 mt-0.5">
                        {recommendedTopic.level} · Click to start learning now
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-9 h-9 grid shrink-0 rounded-xl bg-white/15 place-items-center border-2 border-white/20">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </Card>
                </m.div>
              )}

              {/* ── Roadmap Integration ── */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                <QuickLinkCard
                  href="/roadmap"
                  emoji="🗺️"
                  label="Learning Roadmap"
                  desc="24-week TOEIC plan"
                />
                <QuickLinkCard
                  href="/grammar-quiz"
                  emoji="📝"
                  label="Part 5 Quiz"
                  desc="Real exam practice"
                />
              </m.div>
              </div>{/* end left sidebar */}

              {/* ── Topic Library ── */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <Zap className="h-4 w-4 text-accent" />
                  <h2 className="m-0 font-black text-ink font-display text-[17px]">
                    Topic Library
                  </h2>
                  <span className="text-[10px] font-extrabold rounded-lg text-accent px-2.5 py-0.5 bg-accent-light border-2 border-accent/20">
                    {tabStats.totalTopics} lessons
                  </span>
                </div>
                <TopicGrid
                  onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
                  completedTopics={completedTopics}
                  progressByTopic={progressByTopic}
                  recommendedTopicId={recommendedTopic?.id ?? null}
                  examFilter={examTab}
                />
              </m.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  sub: string;
}) {
  const colorMap: Record<string, { iconBg: string; iconText: string; border: string }> = {
    accent: { iconBg: "bg-accent/10", iconText: "text-accent", border: "border-accent/15" },
    success: { iconBg: "bg-success/10", iconText: "text-success", border: "border-success/15" },
    fire: { iconBg: "bg-fire/10", iconText: "text-fire", border: "border-fire/15" },
    xp: { iconBg: "bg-xp/10", iconText: "text-xp", border: "border-xp/15" },
  };
  const c = colorMap[color] ?? colorMap.accent;

  return (
    <Card
      bgType="alt"
      shadowSize="none"
      className="flex flex-col items-center text-center rounded-2xl py-3.5 px-2"
    >
      <div
        className={`w-9 h-9 grid place-items-center rounded-xl ${c.iconBg} ${c.iconText} border-2 ${c.border} mb-2`}
      >
        {icon}
      </div>
      <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest">
        {label}
      </div>
      <div className="text-lg font-black text-ink font-display leading-none mt-1">{value}</div>
      <div className="text-[11px] font-semibold text-text-muted mt-0.5">{sub}</div>
    </Card>
  );
}
