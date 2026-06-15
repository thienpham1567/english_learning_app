"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  FileText,
  Flame,
  RefreshCw,
  Star,
  Target,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonView } from "@/app/(app)/grammar-lessons/_components/LessonView";
import {
  PriorityTiers,
  type TopicSelection,
} from "@/app/(app)/grammar-lessons/_components/PriorityTiers";
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

const STRATEGY_TIPS = [
  {
    icon: Target,
    title: "Part 5: 20 giây/câu",
    desc: "Xác định từ loại trước để loại ngay 2 đáp án. 80% Part 5 hỏi word form, thì, hoặc hòa hợp chủ–vị.",
  },
  {
    icon: BookOpen,
    title: "Học theo cặp đối lập",
    desc: "Luôn học because vs because of, although vs despite cùng nhau — TOEIC rất hay bẫy liên từ vs giới từ.",
  },
  {
    icon: RefreshCw,
    title: "Luyện lặp ngắt quãng",
    desc: "Sau mỗi bài, AI sinh bài tập 4 tầng: nhận biết → vận dụng → tự viết → ngữ cảnh đề thi.",
  },
  {
    icon: Zap,
    title: "Đừng bỏ qua bị động",
    desc: "10–15% Part 5/6 hỏi bị động. Nắm be + V3 và causative (have something done) là điểm dễ ăn.",
  },
];

export default function GrammarLessonsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<TopicSelection | null>(null);
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
      <div className="relative z-[1] flex-1 overflow-y-auto p-5">
        {/* Soft ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in_srgb,var(--accent)_6%,transparent),transparent_70%)]" />

        <div className={`relative mx-auto w-full ${activeTopic ? "max-w-[720px]" : "max-w-5xl"}`}>
          {activeTopic ? (
            <LessonView
              topicId={activeTopic.id}
              topicTitle={activeTopic.title}
              level={activeTopic.level}
              focusNote={activeTopic.focusNote}
              examMode={examMode}
              onBack={() => setActiveTopic(null)}
              onComplete={(topicId, progress) => {
                setProgressByTopic((prev) => ({ ...prev, [topicId]: progress }));
                void refreshProgress();
              }}
            />
          ) : (
            <div className="flex flex-col gap-9 pb-10">
              {/* ════════ MASTHEAD ════════ */}
              <m.header
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                  {/* Title block */}
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">
                      <span className="inline-block h-2 w-2 rotate-45 bg-accent" />
                      TOEIC · Chương trình Ngữ pháp
                    </div>
                    <h1 className="m-0 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-black uppercase leading-[0.92] tracking-tight text-ink">
                      Lộ trình
                      <br />
                      <span className="relative inline-block">
                        Ngữ pháp
                        <span className="absolute -bottom-1 left-0 h-2 w-full bg-accent/60" />
                      </span>
                    </h1>
                    <p className="mt-3 max-w-md font-medium leading-snug text-text-secondary">
                      {tabStats.totalTopics} bài học xếp theo tần suất xuất hiện trong đề — học từ
                      trên xuống để tối ưu điểm số.
                    </p>
                  </div>

                  {/* Giant completion figure */}
                  <div className="relative shrink-0 border-2 border-border bg-surface px-6 py-4 shadow-[5px_5px_0_var(--shadow-color)]">
                    <div className="absolute -right-2 -top-2 h-4 w-4 border-2 border-border bg-accent" />
                    <div className="font-display text-[clamp(3rem,9vw,5rem)] font-black leading-[0.85] tabular-nums text-ink">
                      {progressPct}
                      <span className="text-accent">%</span>
                    </div>
                    <div className="mt-1 text-right font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
                      Hoàn thành
                    </div>
                  </div>
                </div>

                {/* Spec strip */}
                <div className="mt-6 grid grid-cols-2 divide-y-2 divide-border border-2 border-border bg-surface shadow-[4px_4px_0_var(--shadow-color)] sm:grid-cols-4 sm:divide-x-2 sm:divide-y-0">
                  <SpecCell
                    icon={<BookOpen size={15} />}
                    label="Tổng bài"
                    value={`${tabStats.totalTopics}`}
                    sub={`${tabStats.categories} nhóm`}
                  />
                  <SpecCell
                    icon={<CheckCircle size={15} />}
                    label="Đã xong"
                    value={`${tabStats.completed}`}
                    sub={`/${tabStats.totalTopics} bài`}
                    accent="success"
                  />
                  <SpecCell
                    icon={<Flame size={15} />}
                    label="Đang học"
                    value={`${inProgressTopics.size}`}
                    sub="chủ đề"
                    accent="fire"
                  />
                  <SpecCell
                    icon={<Star size={15} />}
                    label="Còn lại"
                    value={`${tabStats.totalTopics - tabStats.completed}`}
                    sub="cần chinh phục"
                  />
                </div>

                {/* Full-width progress rule */}
                <div className="relative mt-4 h-3.5 w-full border-2 border-border bg-surface">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.2 }}
                    className="absolute inset-y-0 left-0 bg-accent"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg,transparent,transparent 7px,color-mix(in srgb,var(--shadow-color) 14%,transparent) 7px,color-mix(in srgb,var(--shadow-color) 14%,transparent) 9px)",
                    }}
                  />
                </div>
              </m.header>

              {progressError && (
                <div className="flex items-center gap-2.5 border-2 border-warning/30 bg-warning/10 px-4 py-3 font-mono text-xs font-bold text-warning">
                  <AlertTriangle size={14} /> {progressError}
                </div>
              )}

              {/* ════════ ASSIGNMENT TICKET (recommended) ════════ */}
              {recommendedTopic && (
                <m.button
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ x: -2, y: -2 }}
                  whileTap={{ x: 0, y: 0 }}
                  onClick={() =>
                    setActiveTopic({
                      id: recommendedTopic.id,
                      title: recommendedTopic.title,
                      level: recommendedTopic.level,
                    })
                  }
                  className="group relative flex w-full items-stretch overflow-hidden border-2 border-border bg-accent text-left shadow-[5px_5px_0_var(--shadow-color)] transition-shadow hover:shadow-[7px_7px_0_var(--shadow-color)]"
                >
                  {/* Ticket stub */}
                  <div className="relative flex shrink-0 items-center border-r-2 border-dashed border-black/30 px-4 sm:px-6">
                    <span className="font-display text-2xl font-black uppercase tracking-tight text-black [writing-mode:vertical-rl] rotate-180 sm:text-3xl">
                      Next
                    </span>
                  </div>
                  {/* Decorative geometry */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rotate-12 bg-black/[0.07]" />
                  <div className="pointer-events-none absolute -bottom-6 right-16 h-16 w-16 -rotate-6 bg-black/[0.05]" />

                  <div className="flex flex-1 items-center gap-4 px-5 py-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                        <Star size={11} className="fill-current" />
                        Bài tiếp theo nên học
                      </div>
                      <div className="mt-1 font-display text-xl font-black leading-tight text-black sm:text-2xl">
                        {recommendedTopic.title}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-bold text-black/65">
                        Level {recommendedTopic.level} · Bấm để bắt đầu ngay
                      </div>
                    </div>
                    <div className="grid h-11 w-11 shrink-0 place-items-center border-2 border-black bg-surface text-ink shadow-[3px_3px_0_rgba(0,0,0,0.45)] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                </m.button>
              )}

              {/* ════════ THE PROGRAM (roadmap) ════════ */}
              <m.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <Zap className="h-5 w-5 text-accent" />
                  <h2 className="m-0 font-display text-lg font-black uppercase tracking-tight text-ink">
                    Chương trình học
                  </h2>
                  <div className="h-0.5 flex-1 bg-border" />
                  <span className="border-2 border-border bg-surface px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-ink shadow-[2px_2px_0_var(--shadow-color)]">
                    {tabStats.totalTopics} bài
                  </span>
                </div>

                <PriorityTiers
                  completedTopics={completedTopics}
                  inProgressTopics={inProgressTopics}
                  progressByTopic={progressByTopic}
                  onSelectTopic={(selection) => setActiveTopic(selection)}
                />
              </m.section>

              {/* ════════ APPENDIX (quick links + strategy) ════════ */}
              <m.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-text-muted" />
                  <h2 className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    Phụ lục & Công cụ
                  </h2>
                  <div className="h-0.5 flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <QuickLinkCard
                    href="/error-notebook"
                    icon={FileText}
                    label="Sổ tay lỗi sai"
                    desc="Ôn lại những câu đã sai"
                  />
                  <QuickLinkCard
                    href="/grammar-quiz"
                    icon={Target}
                    label="Quiz Part 5"
                    desc="Luyện đề như thi thật"
                  />
                </div>

                <Card shadowSize="md" className="rounded-none border-2 border-border">
                  <div className="mb-4 flex items-center gap-2 font-display text-base font-black text-ink">
                    <span className="grid h-7 w-7 place-items-center border-2 border-border bg-accent text-text-on-accent shadow-[2px_2px_0_var(--shadow-color)]">
                      <Star size={14} className="fill-current" />
                    </span>
                    Chiến lược từ người đạt 900 L&R
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                    {STRATEGY_TIPS.map((tip, i) => (
                      <div
                        key={tip.title}
                        className="relative border-2 border-border bg-surface-alt p-4"
                      >
                        <span className="absolute right-2 top-2 font-mono text-[10px] font-black text-text-muted/50">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <tip.icon className="mb-2 h-5 w-5 text-accent-active" />
                        <div className="mb-1 font-display text-[13.5px] font-black text-ink">
                          {tip.title}
                        </div>
                        <div className="text-xs font-medium leading-normal text-text-secondary">
                          {tip.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </m.section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Monospace stat cell for the masthead spec strip ── */
function SpecCell({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "success" | "fire";
}) {
  const valueColor =
    accent === "success" ? "text-success" : accent === "fire" ? "text-fire" : "text-ink";
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center border-2 border-border bg-bg-deep ${valueColor}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`font-display text-xl font-black leading-none tabular-nums ${valueColor}`}
          >
            {value}
          </span>
          <span className="font-mono text-[10px] font-semibold text-text-muted">{sub}</span>
        </div>
      </div>
    </div>
  );
}
