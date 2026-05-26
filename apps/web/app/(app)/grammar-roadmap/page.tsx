"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

import { Progress, Tooltip } from "antd";
import { api } from "@/lib/api-client";
import {
  getCategoriesForExam,
  type GrammarTopicCategory,
  type GrammarTopic,
} from "@/lib/grammar-lessons/topics";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Flame,
  GitBranch,
  Globe,
  HelpCircle,
  Lightbulb,
  Lock,
  Rocket,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";

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
    title: "Nền Tảng Vững Chắc",
    sub: "Xây dựng gốc rễ ngữ pháp — nền tảng bắt buộc trước khi chạm Part 5/6",
    color: "var(--success)",
    gradient: "linear-gradient(135deg, var(--success), #10b981)",
    emoji: "🌱",
    categoryIds: ["tenses", "subject-verb-agreement", "parts-of-speech", "determiners", "pronouns"],
    tip: "Giai đoạn này quyết định 70% số điểm Part 5. Đừng bỏ qua!",
  },
  {
    id: 2,
    title: "Cấu Trúc Chuyên Sâu",
    sub: "Nắm vững cấu trúc nâng cao — chìa khóa để vượt 700+ điểm",
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, #6d28d9, #7c3aed)",
    emoji: "⚡",
    categoryIds: ["modals", "prepositions", "conjunctions", "conditionals", "comparatives"],
    tip: "Từ đây bắt đầu phân biệt được người 600 vs 800 điểm.",
  },
  {
    id: 3,
    title: "Chinh Phục 800–900",
    sub: "Cấu trúc phức tạp & chiến thuật phòng thi thực tế",
    color: "var(--error)",
    gradient: "linear-gradient(135deg, var(--error), #f97316)",
    emoji: "🔥",
    categoryIds: ["gerunds-infinitives", "passive", "clauses"],
    tip: "Đây là lúc bạn cần luyện đề thật để kiểm tra kiến thức.",
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
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>({});
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
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // All TOEIC categories
  const allCategories = useMemo(() => getCategoriesForExam("toeic"), []);

  // Computed stats
  const completedSet = useMemo(
    () => new Set(
      Object.values(progressByTopic)
        .filter((p) => p.status === "completed")
        .map((p) => p.topicId),
    ),
    [progressByTopic],
  );

  const inProgressSet = useMemo(
    () => new Set(
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
      return { total: topics.length, completed, inProgress: inProg, pct: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0 };
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
    <div className="anim-fade-up h-full overflow-y-auto" style={{padding: "var(--space-6)"}} >
      <div className="w-[900px] mx-auto" >

        {/* ── Overall Progress Card ── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="bg-(--surface) rounded-(--radius-xl) border-2 border-border p-6 mt-5 mb-6 relative overflow-hidden" style={{boxShadow: "var(--shadow-md)"}} >
          <div className="absolute h-[3px]" style={{top: 0, left: 0, right: 0, background: "linear-gradient(90deg, var(--success), var(--accent), var(--error))"}} />

          <div className="flex items-center gap-5 flex-wrap" >
            {/* Circle progress */}
            <Progress
              type="circle"
              percent={overallPct}
              size={90}
              strokeWidth={8}
              strokeColor={{ "0%": "var(--success)", "50%": "var(--accent)", "100%": "var(--error)" }}
              trailColor="var(--border)"
              format={() => (
                <div className="text-center" >
                  <div className="text-2xl font-black text-ink font-display" >{overallPct}%</div>
                  <div className="text-text-muted font-bold" style={{fontSize: 9.5}} >Hoàn thành</div>
                </div>
              )}
            />

            {/* Stats */}
            <div className="flex-1 w-[200px]" >
              <div className="text-lg font-black text-ink font-display mb-1" >
                Tiến độ tổng quan
              </div>
              <div className="flex gap-4 flex-wrap mb-3" >
                <StatPill icon={<CheckCircle className="text-emerald-500" />} label="Đã hoàn thành" value={`${totalCompleted}/${totalTopics}`} />
                <StatPill icon={<Zap className="text-accent" />} label="Đang học" value={String(totalInProgress)} />
                <StatPill icon={<Flame className="text-destructive" />} label="Giai đoạn" value={`${currentPhase}/3`} />
              </div>

              {/* Phase progress mini-bars */}
              <div className="flex gap-1" >
                {PHASE_CONFIG.map((phase) => {
                  const stats = getPhaseStats(phase.categoryIds);
                  return (
                    <Tooltip key={phase.id} title={`${phase.title}: ${stats.completed}/${stats.total} (${stats.pct}%)`}>
                      <div className="flex-1 h-[6px] overflow-hidden" style={{borderRadius: 3, background: "var(--border)"}} >
                        <div className="h-full" style={{width: `${stats.pct}%`, borderRadius: 3, background: phase.gradient, transition: "width 0.5s ease"}} />
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Recommended action */}
            {recommendedTopic && (
              <Link
                href={`/grammar-lessons?topic=${recommendedTopic.id}`}
                style={{ textDecoration: "none" }}
              >
                <m.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }} className="rounded-(--radius-xl) flex items-center gap-2.5 cursor-pointer w-[200px]" style={{padding: "14px 20px", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", boxShadow: "0 6px 20px var(--accent-muted)"}} >
                  <Rocket size={18} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{opacity: 0.8}} >
                      Gợi ý tiếp theo
                    </div>
                    <div className="text-sm font-extrabold" >
                      {recommendedTopic.title}
                    </div>
                  </div>
                  <ArrowRight className="text-sm" style={{marginLeft: "auto"}} />
                </m.div>
              </Link>
            )}
          </div>
        </m.div>

        {/* ── Phase Accordion ── */}
        <div className="flex flex-col gap-4" >
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
                transition={{ delay: 0.15 + phaseIdx * 0.1 }} className="bg-(--surface) rounded-(--radius-xl) overflow-hidden" style={{border: isCurrentPhase ? `2px solid ${phase.color}` : "1px solid var(--border)", boxShadow: isCurrentPhase ? `0 6px 24px color-mix(in srgb, ${phase.color} 12%, transparent)` : "var(--shadow-sm)"}} >
                {/* Phase Header (clickable) */}
                <m.button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  whileHover={{ backgroundColor: "var(--surface-hover)" }} className="w-full border-none bg-transparent cursor-pointer flex items-center gap-4 text-left" style={{padding: "20px 24px"}} >
                  {/* Phase number badge */}
                  <div className="w-[48px] h-[48px] grid shrink-0 text-2xl" style={{borderRadius: 14, background: phase.gradient, placeItems: "center"}} >
                    {isPastPhase ? <CheckCircle style={{ color: "#fff" }} /> : phase.emoji}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 w-[0px]" >
                    <div className="flex items-center gap-2" style={{marginBottom: 2}} >
                      <span className="text-[10px] font-black uppercase" style={{letterSpacing: "0.12em", color: phase.color}} >
                        Giai đoạn {String(phase.id).padStart(2, "0")}
                      </span>
                      {isCurrentPhase && (
                        <span className="text-[9px] font-extrabold rounded-md" style={{padding: "2px 8px", background: `color-mix(in srgb, ${phase.color} 12%, var(--surface))`, color: phase.color, border: `1px solid color-mix(in srgb, ${phase.color} 25%, transparent)`}} >
                          ĐAng HỌC
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-ink font-display" >
                      {phase.title}
                    </div>
                    <div className="text-xs text-text-muted font-semibold" style={{marginTop: 2}} >
                      {phase.sub}
                    </div>
                  </div>

                  {/* Phase progress */}
                  <div className="text-right shrink-0" >
                    <div className="text-2xl font-black font-display" style={{color: phase.color}} >
                      {stats.pct}%
                    </div>
                    <div className="text-[11px] text-text-muted font-bold" >
                      {stats.completed}/{stats.total} chủ đề
                    </div>
                  </div>

                  {/* Chevron */}
                  <m.div
                    animate={{ rotate: isExpanded ? 90 : 0 }} className="text-sm text-text-muted shrink-0" >
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
                      transition={{ type: "spring", stiffness: 300, damping: 30 }} className="overflow-hidden" >
                      <div className="flex flex-col gap-4" style={{padding: "0 24px 24px"}} >
                        {/* Expert tip */}
                        <div className="py-3 px-4 rounded-(--radius-lg) flex items-start gap-2.5" style={{background: `color-mix(in srgb, ${phase.color} 5%, var(--surface-alt))`, border: `1px solid color-mix(in srgb, ${phase.color} 15%, transparent)`}} >
                          <Lightbulb className="text-base" style={{color: phase.color, marginTop: 2}} />
                          <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{color: phase.color}} >
                              Kinh nghiệm 900 điểm
                            </div>
                            <div className="text-[13px] text-text-secondary font-semibold leading-normal" style={{marginTop: 2}} >
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
          transition={{ delay: 0.5 }} className="bg-(--surface) rounded-(--radius-xl) border-2 border-border p-6 mt-6" style={{boxShadow: "var(--shadow-sm)"}} >
          <div className="text-base font-black text-ink font-display mb-4 flex items-center gap-2" >
            <Trophy className="text-(--xp)" />
            Chiến lược từ người đạt 900 L&R
          </div>
          <div className="grid gap-3" style={{gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"}} >
            {[
              {
                emoji: "🎯",
                title: "Part 5: 20 giây/câu",
                desc: "Nhận diện từ loại trước, loại trừ 2 đáp án ngay lập tức. 80% câu Part 5 test từ loại + thì + hòa hợp chủ vị.",
              },
              {
                emoji: "📚",
                title: "Học theo cặp đối lập",
                desc: "Luôn học Because vs Because of, Although vs Despite cùng lúc. TOEIC thích test sự khác biệt giữa liên từ và giới từ.",
              },
              {
                emoji: "🔁",
                title: "Luyện lặp lại cách quãng",
                desc: "Sau mỗi bài học, hệ thống AI sẽ tạo bài tập 4 tầng: nhận diện → áp dụng → tự viết → ngữ cảnh đề thi.",
              },
              {
                emoji: "⚡",
                title: "Đừng bỏ qua Passive Voice",
                desc: "10–15% câu Part 5/6 test thể bị động. Nắm vững be + V3 và causative (have something done) là ăn điểm chắc.",
              },
            ].map((tip, i) => (
              <div
                key={i} className="rounded-(--radius-lg) bg-surface-alt border-2 border-border" style={{padding: "14px 16px"}} >
                <div className="text-xl mb-1.5" >{tip.emoji}</div>
                <div className="font-extrabold text-ink mb-1" style={{fontSize: 13.5}} >{tip.title}</div>
                <div className="text-xs text-text-secondary leading-normal font-medium" >{tip.desc}</div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Quick links */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }} className="flex gap-2.5 mt-5 flex-wrap" style={{marginBottom: 40}} >
          <QuickLinkCard href="/grammar-lessons" emoji="📖" label="Thư viện bài học" desc="50+ chủ đề AI-generated" />
          <QuickLinkCard href="/grammar-quiz" emoji="📝" label="Part 5 Quiz" desc="Luyện đề thực chiến" />
          <QuickLinkCard href="/toeic/grammar/drill" emoji="🎯" label="Grammar Drill" desc="Luyện theo kỹ năng yếu" />
          <QuickLinkCard href="/toeic/practice" emoji="🏆" label="Luyện đề TOEIC" desc="Full test Part 3-7" />
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
  const pct = category.topics.length > 0 ? Math.round((completed / category.topics.length) * 100) : 0;
  const icon = CATEGORY_ICONS[category.id] ?? <BookOpen />;

  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }} className="bg-surface-alt rounded-(--radius-lg) border-2 border-border" style={{padding: "16px 18px"}} >
      {/* Category header */}
      <div className="flex items-center gap-2.5 mb-3" >
        <div className="w-[32px] h-[32px] grid text-[15px] shrink-0" style={{borderRadius: 10, background: `color-mix(in srgb, ${category.color} 10%, var(--surface))`, color: category.color, placeItems: "center"}} >
          {icon}
        </div>
        <div className="flex-1 w-[0px]" >
          <div className="text-sm font-extrabold text-ink" >
            {category.title}
          </div>
          <div className="text-[11px] text-text-muted font-semibold" >
            {completed}/{category.topics.length} · {pct}%
          </div>
        </div>
        <div className="w-[60px]" >
          <div className="h-[5px]" style={{borderRadius: 3, background: "var(--border)"}} >
            <div className="h-full" style={{width: `${pct}%`, borderRadius: 3, background: category.color, transition: "width 0.4s ease"}} />
          </div>
        </div>
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap gap-1.5" >
        {category.topics.map((topic) => {
          const isDone = completedSet.has(topic.id);
          const isInProg = inProgressSet.has(topic.id);

          return (
            <Link
              key={topic.id}
              href={`/grammar-lessons?topic=${topic.id}`}
              style={{ textDecoration: "none" }}
            >
              <m.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }} className="flex items-center py-1.5 px-3 text-xs font-bold cursor-pointer" style={{gap: 5, borderRadius: 10, transition: "all 0.15s", border: isDone
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : isInProg
                    ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                    : "1px solid var(--border)", background: isDone
                    ? "rgba(16, 185, 129, 0.06)"
                    : isInProg
                    ? "color-mix(in srgb, var(--accent) 5%, var(--surface))"
                    : "var(--surface)", color: isDone
                    ? "var(--success)"
                    : isInProg
                    ? "var(--accent)"
                    : "var(--text-secondary)"}} >
                {isDone ? (
                  <CheckCircle className="text-[11px] text-emerald-500" />
                ) : isInProg ? (
                  <Zap className="text-[11px] text-accent" />
                ) : (
                  <span className="font-extrabold rounded" style={{fontSize: 8.5, padding: "1px 4px", background: topic.level === "A2" ? "rgba(16, 185, 129, 0.1)" : topic.level === "B1" ? "rgba(59, 130, 246, 0.1)" : "rgba(245, 158, 11, 0.1)", color: topic.level === "A2" ? "var(--success)" : topic.level === "B1" ? "var(--info)" : "var(--warning)"}} >
                    {topic.level}
                  </span>
                )}
                <span>{topic.title}</span>
              </m.div>
            </Link>
          );
        })}
      </div>
    </m.div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5" >
      {icon}
      <span className="text-xs text-text-muted font-semibold" >{label}:</span>
      <span className="text-[13px] font-extrabold text-ink" >{value}</span>
    </div>
  );
}

function QuickLinkCard({ href, emoji, label, desc }: { href: string; emoji: string; label: string; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", flex: "1 1 200px" }}>
      <m.div
        whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
        whileTap={{ scale: 0.98 }} className="rounded-(--radius-xl) bg-(--surface) border-2 border-border cursor-pointer flex items-center gap-3" style={{padding: "16px 18px", transition: "all 0.15s"}} >
        <span className="text-2xl" >{emoji}</span>
        <div>
          <div className="font-extrabold text-ink" style={{fontSize: 13.5}} >{label}</div>
          <div className="text-[11px] text-text-muted font-semibold" >{desc}</div>
        </div>
      </m.div>
    </Link>
  );
}
