"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as m from "motion/react-client";
import {
  FireOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  BookOutlined,
  SyncOutlined,
  AimOutlined,
  QuestionCircleOutlined,
  ExceptionOutlined,
  RiseOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  StarFilled,
  RocketOutlined,
} from "@ant-design/icons";
import { Progress, Skeleton } from "antd";
import { useDashboard, type DashboardData } from "@/hooks/useDashboard";
import { useDailyStudyPlan, type DailyPlanItem, type DailyPlanStats } from "@/hooks/useDailyStudyPlan";
import { api } from "@/lib/api-client";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { HeatmapCalendar } from "@/app/(app)/dashboard/_components/HeatmapCalendar";
import { WeeklyReport } from "@/app/(app)/dashboard/_components/WeeklyReport";

// ── Types ────────────────────────────────────────────────────────
type PredictedScore = {
  predicted: number | null;
  insufficient: boolean;
  confidence?: number;
  reading?: number;
  listening?: number;
  components?: { grammar: number; listeningAccuracy: number; vocabulary: number; topScores: number };
  dataPoints?: { quizzes: number; listening: number; vocabulary: number };
  weeklyXP?: { week: string; xp: number }[];
  quizzesNeeded?: number;
  listeningNeeded?: number;
};

// ── Styles ───────────────────────────────────────────────────────
const card: React.CSSProperties = {
  borderRadius: 20, border: "1px solid var(--border)",
  background: "var(--surface)", boxShadow: "var(--shadow-md)",
  padding: "24px 22px", position: "relative", overflow: "hidden",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "0.14em", color: "var(--accent)",
  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
};
const accentBar: React.CSSProperties = {
  width: 3, height: 14, borderRadius: 2, background: "var(--accent)", flexShrink: 0,
};
const statBox: React.CSSProperties = {
  flex: 1, padding: "16px 18px", borderRadius: 14,
  background: "var(--card-bg)", border: "1px solid var(--border)",
  textAlign: "center", minWidth: 100,
};

// ── Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { state: dashState } = useDashboard();
  const { state: planState } = useDailyStudyPlan({ budget: "20" });
  const [score, setScore] = useState<PredictedScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<PredictedScore>("/predicted-score")
      .then((d) => { if (!cancelled) setScore(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setScoreLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const dash: DashboardData | null = dashState.status === "ready" ? dashState.data : null;
  const planReady = planState.status === "ready" ? planState : null;

  return (
    <div style={{ minHeight: "100%", overflowY: "auto", padding: "12px 12px 40px" }}>
      {/* ── Hero Header ── */}
      <ModuleHeader
        icon={<RocketOutlined />}
        gradient="var(--gradient-dashboard)"
        title="TOEIC Master"
        subtitle="Tổng quan luyện thi của bạn"
      />

      <div className="dashboard-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 16px" }}>
        {/* Left Column: Focus & Core Actions */}
        <div className="dashboard-main-col">
          {/* ── Predicted TOEIC Score ── */}
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={card}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--accent), var(--secondary))" }} />
            <div style={sectionLabel}>
              <div style={accentBar} />
              <span>Điểm TOEIC dự đoán</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {scoreLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : score?.insufficient ? (
              <InsufficientDataCard score={score} />
            ) : score?.predicted ? (
              <ScoreDisplay score={score} />
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Chưa có đủ dữ liệu</p>
            )}
          </m.div>

          {/* ── Daily Study Plan ── */}
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={card}>
            <div style={sectionLabel}>
              <div style={accentBar} />
              <span>Kế hoạch hôm nay</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {planState.status === "loading" ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : planReady ? (
              <StudyPlanSection items={planReady.plan.items} stats={planReady.stats} />
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>Hãy làm thêm bài tập để hệ thống gợi ý kế hoạch học!</p>
            )}
          </m.div>

          {/* ── Quick Actions ── */}
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={card}>
            <div style={sectionLabel}>
              <div style={accentBar} />
              <span>Truy cập nhanh</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <QuickActions dash={dash} />
          </m.div>

          {/* ── AI Weekly Report ── */}
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <WeeklyReport />
          </m.div>
        </div>

        {/* Right Column: Analytics & Motivation */}
        <div className="dashboard-side-col">
          {/* ── Streak + XP Row ── */}
          <m.div
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", width: "100%" }}
          >
            <StatCard icon={<FireOutlined style={{ color: "var(--fire, #f97316)" }} />} label="Streak" value={dash ? `${dash.streak.currentStreak} ngày` : "—"} sub={dash ? `Kỷ lục: ${dash.streak.bestStreak}` : ""} loading={!dash} />
            <StatCard icon={<ThunderboltOutlined style={{ color: "var(--xp, #eab308)" }} />} label="Tổng XP" value={dash ? `${dash.totalXP.toLocaleString()}` : "—"} sub="Kinh nghiệm tích lũy" loading={!dash} />
            <StatCard icon={<SyncOutlined style={{ color: "var(--accent)" }} />} label="Cần ôn" value={dash ? `${dash.flashcardsDue + dash.vocabDue}` : "—"} sub={dash ? `${dash.flashcardsDue} flashcard · ${dash.vocabDue} từ vựng` : ""} loading={!dash} />
          </m.div>

          {/* ── Weekly Activity ── */}
          {dash && dash.weeklyActivity.length > 0 && (
            <div className="anim-fade-up anim-delay-4" style={{ ...card, width: "100%" }}>
              <div style={sectionLabel}>
                <div style={accentBar} />
                <span>Hoạt động tuần này</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <WeeklyChart data={dash.weeklyActivity} />
            </div>
          )}

          {/* ── Heatmap Calendar ── */}
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ ...card, width: "100%" }}>
            <div style={sectionLabel}>
              <div style={accentBar} />
              <span>Lịch hoạt động 90 ngày</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <HeatmapCalendar />
          </m.div>

          {/* ── Score Timeline ── */}
          {score?.weeklyXP && score.weeklyXP.length > 1 && (
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ ...card, width: "100%" }}>
              <div style={sectionLabel}>
                <div style={accentBar} />
                <span>Xu hướng XP theo tuần</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <ScoreTimeline data={score.weeklyXP} />
            </m.div>
          )}

          {/* ── Recent Badges ── */}
          {dash && dash.badges.filter(b => b.unlocked).length > 0 && (
            <div className="anim-fade-up anim-delay-5" style={{ ...card, width: "100%" }}>
              <div style={sectionLabel}>
                <div style={accentBar} />
                <span>Huy hiệu đã đạt</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {dash.badges.filter(b => b.unlocked).map(b => (
                  <div key={b.id} style={{
                    padding: "10px 16px", borderRadius: 12,
                    background: "color-mix(in srgb, var(--xp) 8%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--xp) 20%, transparent)",
                    display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600,
                  }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <span style={{ color: "var(--ink)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ icon, label, value, sub, loading }: {
  icon: React.ReactNode; label: string; value: string; sub: string; loading: boolean;
}) {
  return (
    <m.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={statBox}
    >
      {loading ? <Skeleton.Button active size="small" style={{ width: 60 }} /> : (
        <>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-display)" }}>{value}</div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </>
      )}
    </m.div>
  );
}

function ScoreDisplay({ score }: { score: PredictedScore }) {
  const pct = Math.round(((score.predicted ?? 0) / 990) * 100);
  const color = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--accent)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <div style={{ textAlign: "center" }}>
        <Progress type="circle" percent={pct} size={130} strokeWidth={8} strokeColor={color} trailColor="var(--border)"
          format={() => (
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{score.predicted}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>/ 990</div>
            </div>
          )}
        />
        {score.confidence !== undefined && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>±{score.confidence} điểm</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* L/R split */}
        <div style={{ display: "flex", gap: 8 }}>
          <MiniScore label="Listening" value={score.listening ?? 0} max={495} color="var(--accent)" />
          <MiniScore label="Reading" value={score.reading ?? 0} max={495} color="var(--secondary)" />
        </div>
        {/* Components */}
        {score.components && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { k: "Grammar", v: score.components.grammar },
              { k: "Listening", v: score.components.listeningAccuracy },
              { k: "Vocabulary", v: score.components.vocabulary },
              { k: "Top Scores", v: score.components.topScores },
            ].map(c => (
              <div key={c.k} style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.v}%</span> {c.k}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniScore({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{
      flex: 1, padding: "10px 12px", borderRadius: 12,
      background: `color-mix(in srgb, ${color} 6%, var(--surface))`,
      border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>/{max} · {label}</div>
    </div>
  );
}

function InsufficientDataCard({ score }: { score: PredictedScore }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <RiseOutlined style={{ fontSize: 32, color: "var(--text-muted)", marginBottom: 12 }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>Cần thêm dữ liệu để dự đoán</p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
        {score.quizzesNeeded ? `Cần thêm ${score.quizzesNeeded} bài quiz` : ""}
        {score.quizzesNeeded && score.listeningNeeded ? " và " : ""}
        {score.listeningNeeded ? `${score.listeningNeeded} bài nghe` : ""}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/grammar-quiz" style={{
          padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600,
          background: "var(--accent)", color: "var(--text-on-accent)", textDecoration: "none",
        }}>
          <QuestionCircleOutlined style={{ marginRight: 6 }} />Làm Grammar Quiz
        </Link>
        <Link href="/toeic-skills" style={{
          padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600,
          border: "1.5px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none",
        }}>
          <AimOutlined style={{ marginRight: 6 }} />Luyện Listening
        </Link>
      </div>
    </div>
  );
}

function StudyPlanSection({ items, stats }: { items: DailyPlanItem[]; stats: DailyPlanStats }) {
  const completed = items.filter(i => i.completed).length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, var(--accent), var(--secondary))", transition: "width 0.4s ease" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{completed}/{items.length}</span>
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <Link key={item.id} href={item.actionUrl} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 12,
              border: "1px solid var(--border)",
              background: item.completed ? "color-mix(in srgb, var(--success) 4%, var(--surface))" : "var(--surface)",
              opacity: item.completed ? 0.7 : 1,
              transition: "all 0.15s", cursor: "pointer",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0,
                background: item.completed ? "var(--success)" : item.priority === "high" ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--bg-deep)",
                color: item.completed ? "#fff" : item.priority === "high" ? "var(--accent)" : "var(--text-muted)", fontSize: 12,
              }}>
                {item.completed ? <CheckCircleFilled /> : <RocketOutlined />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, fontSize: 10 }} />{item.estimatedMinutes} phút · {item.reason}
                </div>
              </div>
              {item.priority === "high" && !item.completed && (
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "color-mix(in srgb, var(--error) 10%, var(--surface))", color: "var(--error)" }}>
                  Ưu tiên
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* XP bar */}
      {stats && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--bg-deep)", display: "flex", alignItems: "center", gap: 10 }}>
          <StarFilled style={{ color: "var(--xp)", fontSize: 14 }} />
          <div style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)" }}>
            Level {stats.levelNumber} · <strong>{stats.totalXP.toLocaleString()} XP</strong>
          </div>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: "var(--border)" }}>
            <div style={{ width: `${Math.min(100, (stats.currentLevelXP / stats.nextLevelXP) * 100)}%`, height: "100%", borderRadius: 2, background: "var(--xp)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/daily-challenge", icon: <FireOutlined />, label: "Thử thách", color: "var(--fire, #f97316)" },
  { href: "/toeic-skills", icon: <AimOutlined />, label: "4 Skills", color: "var(--accent)" },
  { href: "/toeic-practice", icon: <TrophyOutlined />, label: "Luyện đề", color: "var(--secondary)" },
  { href: "/grammar-quiz", icon: <QuestionCircleOutlined />, label: "Part 5", color: "var(--info)" },
  { href: "/flashcards", icon: <BookOutlined />, label: "Flashcard", color: "var(--success)" },
  { href: "/error-notebook", icon: <ExceptionOutlined />, label: "Sổ lỗi", color: "var(--error)" },
  { href: "/my-vocabulary", icon: <StarFilled />, label: "Từ vựng", color: "var(--xp)" },
];

function QuickActions({ dash }: { dash: DashboardData | null }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {QUICK_ACTIONS.map((a, i) => (
        <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 8px", borderRadius: 14, textAlign: "center",
              border: "1px solid var(--border)", background: "var(--surface)",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center",
              margin: "0 auto 8px",
              background: `color-mix(in srgb, ${a.color} 10%, var(--surface))`,
              color: a.color, fontSize: 18,
            }}>
              {a.icon}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{a.label}</div>
          </m.div>
        </Link>
      ))}
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.count / max) * 64);
        return (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.count > 0 ? "var(--accent)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {d.count > 0 ? d.count : ""}
            </div>
            <m.div
              initial={{ height: 4 }}
              animate={{ height: h }}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
              style={{
                width: "100%", maxWidth: 32, borderRadius: 6,
                background: d.count > 0 ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent))" : "var(--border)",
              }}
            />
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{dayLabels[i] ?? d.day}</div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreTimeline({ data }: { data: Array<{ week: string; xp: number }> }) {
  const maxXP = Math.max(...data.map(d => d.xp), 1);
  const chartH = 100;

  // Build SVG polyline points
  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = chartH - (d.xp / maxXP) * (chartH - 10) - 5;
    return `${x},${y}`;
  }).join(" ");

  // Gradient area
  const areaPoints = `0,${chartH} ${points} 100,${chartH}`;

  return (
    <div>
      <svg viewBox={`0 0 100 ${chartH}`} style={{ width: "100%", height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#xpGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
          const y = chartH - (d.xp / maxXP) * (chartH - 10) - 5;
          return (
            <circle
              key={d.week}
              cx={x}
              cy={y}
              r="2"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d) => (
          <div key={d.week} style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{d.xp}</div>
            <div>T{new Date(d.week).getDate()}/{new Date(d.week).getMonth() + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
