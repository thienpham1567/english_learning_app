"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Progress } from "antd";
import * as m from "motion/react-client";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { TopicGrid } from "@/app/(app)/grammar-lessons/_components/TopicGrid";
import { LessonView } from "@/app/(app)/grammar-lessons/_components/LessonView";
import { api } from "@/lib/api-client";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import type { ExamType, GrammarTopic } from "@/lib/grammar-lessons/topics";
import { getCategoriesForExam } from "@/lib/grammar-lessons/topics";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Flame,
  Rocket,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

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
  const [activeTopic, setActiveTopic] = useState<{ id: string; title: string; level: string } | null>(null);
  const examTab: ExamType = "toeic";
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>({});
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const completedTopics = useMemo(
    () => new Set(Object.values(progressByTopic).filter((item) => item.status === "completed").map((item) => item.topicId)),
    [progressByTopic],
  );

  const inProgressTopics = useMemo(
    () => new Set(Object.values(progressByTopic).filter((item) => item.status === "in_progress").map((item) => item.topicId)),
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
      setProgressError("Chưa tải được tiến độ học.");
    }
  }, [examMode]);

  useEffect(() => {
    let cancelled = false;

    api.get<ProgressResponse>("/grammar-lessons/progress", {
      params: { examMode },
    })
      .then((data) => {
        if (cancelled) return;
        setProgressByTopic(data.summary.progressByTopic);
        setRecommendedTopic(data.recommendedTopic);
        setProgressError(null);
      })
      .catch(() => {
        if (!cancelled) setProgressError("Chưa tải được tiến độ học.");
      });

    return () => {
      cancelled = true;
    };
  }, [examMode]);

  const progressPct = tabStats.totalTopics > 0 ? Math.round((tabStats.completed / tabStats.totalTopics) * 100) : 0;

  return (
    <div className="relative flex h-full h-[0px] flex-1 flex-col overflow-hidden" >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Content area */}
      <div className="relative h-[0px] flex-1 overflow-y-auto z-[1]" style={{padding: "24px 20px"}} >
        {/* Soft gradient wash */}
        <div className="absolute" style={{pointerEvents: "none", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)"}} />

        <div className="relative mx-auto w-[720px] w-full" >
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
            <div className="flex flex-col gap-5" >

              {/* ── Hero Stats Dashboard ── */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }} className="bg-(--surface) rounded-(--radius-xl) border-2 border-border p-6 relative overflow-hidden" style={{boxShadow: "var(--shadow-md)"}} >
                {/* Top accent bar */}
                <div className="absolute h-[3px]" style={{top: 0, left: 0, right: 0, background: "linear-gradient(90deg, var(--accent), var(--secondary), var(--success))"}} />

                <div className="flex items-center gap-6 flex-wrap" >
                  {/* Circle progress */}
                  <Progress
                    type="circle"
                    percent={progressPct}
                    size={88}
                    strokeWidth={8}
                    strokeColor={{ "0%": "var(--accent)", "100%": "var(--success)" }}
                    trailColor="var(--border)"
                    format={() => (
                      <div className="text-center" >
                        <div className="text-2xl font-black text-ink font-display" >{progressPct}%</div>
                        <div className="text-[9px] text-text-muted font-bold" >Hoàn thành</div>
                      </div>
                    )}
                  />

                  {/* Stats grid */}
                  <div className="flex-1 w-[200px] grid gap-3" style={{gridTemplateColumns: "1fr 1fr 1fr"}} >
                    <StatCard
                      icon={<BookOpen />}
                      iconColor="var(--accent)"
                      iconBg="var(--accent-light)"
                      label="Chủ đề"
                      value={`${tabStats.categories} nhóm`}
                      sub={`${tabStats.totalTopics} bài học`}
                    />
                    <StatCard
                      icon={<CheckCircle />}
                      iconColor="var(--success)"
                      iconBg="rgba(16, 185, 129, 0.08)"
                      label="Hoàn thành"
                      value={`${tabStats.completed}`}
                      sub={`/${tabStats.totalTopics} bài`}
                    />
                    <StatCard
                      icon={progressPct === 100 ? <Trophy /> : <Flame />}
                      iconColor={progressPct === 100 ? "var(--xp)" : "var(--fire)"}
                      iconBg={progressPct === 100 ? "rgba(139, 92, 246, 0.08)" : "rgba(245, 158, 11, 0.08)"}
                      label="Đang học"
                      value={`${inProgressTopics.size}`}
                      sub="chủ đề"
                    />
                  </div>
                </div>
              </m.div>

              {/* Progress error */}
              {progressError && (
                <Alert
                  type="warning"
                  showIcon
                  message={progressError} className="rounded-(--radius-lg) text-[13px] font-semibold" />
              )}

              {/* ── Recommended Topic CTA ── */}
              {recommendedTopic && (
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <m.button
                    onClick={() => setActiveTopic({ id: recommendedTopic.id, title: recommendedTopic.title, level: recommendedTopic.level })}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }} className="w-full rounded-(--radius-xl) border-none cursor-pointer flex items-center gap-4 relative overflow-hidden text-left" style={{padding: "18px 24px", background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))", boxShadow: "0 8px 28px var(--accent-muted)"}} >
                    {/* Decorative glow */}
                    <div className="absolute w-[200px] h-[200px] rounded-full" style={{top: "-50%", right: "-10%", background: "rgba(255,255,255,0.06)", pointerEvents: "none"}} />
                    <div className="absolute w-[150px] h-[150px] rounded-full" style={{bottom: "-40%", left: "-5%", background: "rgba(255,255,255,0.04)", pointerEvents: "none"}} />

                    {/* Icon */}
                    <div className="w-[48px] h-[48px] grid shrink-0" style={{borderRadius: 14, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", placeItems: "center"}} >
                      <Rocket className="text-2xl" style={{color: "#fff"}} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 relative" >
                      <div className="text-[10.5px] font-extrabold uppercase" style={{color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em"}} >
                        <Star className="text-[9px] mr-1" />
                        Bài học gợi ý tiếp theo
                      </div>
                      <div className="font-black font-display" style={{fontSize: 17, color: "#fff", marginTop: 3}} >
                        {recommendedTopic.title}
                      </div>
                      <div className="font-semibold" style={{fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 2}} >
                        {recommendedTopic.level} · Bấm để bắt đầu học ngay
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-[36px] h-[36px] grid shrink-0" style={{borderRadius: 10, background: "rgba(255,255,255,0.15)", placeItems: "center"}} >
                      <ArrowRight className="text-sm" style={{color: "#fff"}} />
                    </div>
                  </m.button>
                </m.div>
              )}

              {/* ── Quick Actions ── */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }} className="grid gap-2.5" style={{gridTemplateColumns: "1fr 1fr"}} >
                <QuickAction
                  href="/grammar-roadmap"
                  emoji="🗺️"
                  label="Lộ trình học"
                  desc="Xem bản đồ 3 giai đoạn"
                  color="var(--accent)"
                  onClick={() => {}}
                />
                <QuickAction
                  href="/grammar-quiz"
                  emoji="📝"
                  label="Quiz Part 5"
                  desc="Luyện đề thực chiến"
                  color="var(--success)"
                  onClick={() => {}}
                />
              </m.div>

              {/* Topic grid */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2" style={{marginBottom: 14}} >
                  <Zap className="text-accent text-base" />
                  <h2 className="m-0 font-black text-ink font-display" style={{fontSize: 17}} >
                    Thư viện chủ đề
                  </h2>
                  <span className="text-[11px] font-bold rounded-md text-accent" style={{padding: "2px 8px", background: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)"}} >
                    {tabStats.totalTopics} bài
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
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center text-center rounded-(--radius-lg) bg-surface-alt border-2 border-border" style={{padding: "12px 8px"}} >
      <div className="w-[34px] h-[34px] grid text-base mb-2" style={{borderRadius: 10, background: iconBg, placeItems: "center", color: iconColor}} >
        {icon}
      </div>
      <div className="font-bold text-text-muted uppercase" style={{fontSize: 9.5, letterSpacing: "0.06em"}} >
        {label}
      </div>
      <div className="text-lg font-black text-ink font-display" style={{lineHeight: 1.1, marginTop: 2}} >
        {value}
      </div>
      <div className="text-[11px] font-semibold text-text-muted" style={{marginTop: 1}} >
        {sub}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  emoji,
  label,
  desc,
  color,
  onClick,
}: {
  href: string;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <m.a
      href={href}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} className="flex items-center gap-3 rounded-(--radius-xl) bg-(--surface) border-2 border-border cursor-pointer" style={{padding: "14px 16px", textDecoration: "none", transition: "all 0.15s"}} >
      <span className="text-2xl" >{emoji}</span>
      <div>
        <div className="font-extrabold text-ink" style={{fontSize: 13.5}} >{label}</div>
        <div className="text-[11px] text-text-muted font-semibold" >{desc}</div>
      </div>
    </m.a>
  );
}
