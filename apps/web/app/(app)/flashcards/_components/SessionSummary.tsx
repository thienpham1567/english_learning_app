"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Space, Typography, Button } from "antd";

import * as m from "motion/react-client";

import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { useDashboard } from "@/hooks/useDashboard";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Flame,
  Frown,
  Meh,
  RefreshCw,
  Smile,
  ThumbsUp,
  Trophy,
} from "lucide-react";

const { Title, Text } = Typography;

type Props = {
  totalReviewed: number;
  averageQuality: number;
  forgottenCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  onRestart?: () => void;
};

const DISTRIBUTION_ITEMS = [
  { key: "easy", label: "Dễ", icon: <ThumbsUp />, color: "var(--success)" },
  { key: "good", label: "Ổn", icon: <Smile />, color: "var(--accent)" },
  { key: "hard", label: "Khó", icon: <Meh />, color: "var(--warning)" },
  { key: "again", label: "Quên", icon: <Frown />, color: "var(--error)" },
];

function useSummaryContext() {
  const { state } = useDashboard();
  if (state.status !== "ready") return { streak: 0, dailyChallengeCompleted: false };
  return {
    streak: state.data.streak?.currentStreak ?? 0,
    dailyChallengeCompleted: state.data.dailyChallenge?.completed ?? false,
  };
}

export function SessionSummary({
  totalReviewed,
  averageQuality,
  forgottenCount,
  againCount,
  hardCount,
  goodCount,
  easyCount,
  onRestart,
}: Props) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);
  const { streak, dailyChallengeCompleted } = useSummaryContext();

  const counts: Record<string, number> = { easy: easyCount, good: goodCount, hard: hardCount, again: againCount };

  return (
    <>
      <CelebrationOverlay
        tier="medium"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      >
        <Title level={3} className="m-0" style={{color: "var(--text-on-accent)", textShadow: "0 2px 8px rgba(0,0,0,0.3)"}} >
          <Trophy /> Bạn đã ôn xong!
        </Title>
      </CelebrationOverlay>

      <Flex vertical align="stretch" gap={20} className="anim-scale-in w-[500px] mx-auto w-full" >
        
        {/* Streak & Hero banner */}
        <div className="rounded-(--radius-xl) border border-(--border) text-center relative overflow-hidden flex flex-col items-center gap-3" style={{background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))", padding: "32px 24px", boxShadow: "var(--shadow-sm)"}} >
          {/* Ambient glow behind streak */}
          <div className="absolute w-[220px] h-[220px] rounded-full" style={{left: "50%", top: "40%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, var(--accent) 12%, transparent 70%)", pointerEvents: "none"}} />

          <div className="relative z-[1]" >
            <StreakFire streak={streak} />
          </div>

          <Title level={3} className="mt-3 mb-1 font-black text-text-primary" >
            Hoàn thành phiên ôn tập!
          </Title>
          <Text className="text-sm text-text-secondary font-medium" >
            Bạn đã xuất sắc ghi nhớ <span className="text-accent font-bold" >{totalReviewed}</span> từ vựng hôm nay.
          </Text>
        </div>

        {/* Stats Grid cards */}
        <Flex gap={12} className="w-full" >
          {[
            { label: "Đã ôn tập", value: totalReviewed, color: "var(--accent)" },
            { label: "Chất lượng TB", value: `${averageQuality.toFixed(1)}/5`, color: "var(--xp)" },
            { label: "Số từ quên", value: forgottenCount, color: forgottenCount > 0 ? "var(--error)" : "var(--success)" },
          ].map((stat, idx) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }} className="flex-1 bg-(--surface) border border-(--border) rounded-(--radius-lg) text-center" style={{padding: "16px 12px", boxShadow: "var(--shadow-sm)"}} >
              <div className="text-2xl font-black font-display" style={{color: stat.color, lineHeight: 1.1}} >
                {stat.value}
              </div>
              <div className="text-[11px] text-text-muted font-bold mt-1" >
                {stat.label}
              </div>
            </m.div>
          ))}
        </Flex>

        {/* Distribution card */}
        {totalReviewed > 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }} className="bg-(--surface) rounded-(--radius-xl) border border-(--border)" style={{padding: "18px 20px", boxShadow: "var(--shadow-sm)"}} >
            <span className="text-[13px] font-extrabold text-text-primary flex items-center gap-1.5 mb-4" >
              <BarChart3 className="text-accent" />
              Phân bố mức độ ghi nhớ
            </span>
            <Flex gap={12}>
              {DISTRIBUTION_ITEMS.map((item) => {
                const count = counts[item.key] ?? 0;
                const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
                return (
                  <Flex key={item.key} vertical align="center" gap={6} className="flex-1" >
                    {/* Custom vertical bar graph */}
                    <div className="w-[8px] h-[52px] rounded-full relative overflow-hidden flex flex-col justify-end" style={{background: "var(--border)"}} >
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }} className="w-full rounded-full" style={{background: item.color}} />
                    </div>
                    <span className="text-[11px] font-bold text-text-primary" >
                      {count}
                    </span>
                    <span className="text-[11px] text-text-muted font-semibold" >
                      {item.label}
                    </span>
                  </Flex>
                );
              })}
            </Flex>
          </m.div>
        )}

        {/* Daily challenge prompt */}
        {!dailyChallengeCompleted && (
          <m.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/daily-challenge")} className="text-left rounded-(--radius-xl) py-4 px-5 cursor-pointer flex items-center gap-3.5" style={{background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))", boxShadow: "var(--shadow-sm)"}} >
            <div className="w-[44px] h-[44px] rounded-full grid shrink-0" style={{background: "rgba(245, 158, 11, 0.08)", placeItems: "center"}} >
              <Flame className="text-2xl text-(--xp)" />
            </div>
            <div className="flex-1" >
              <h4 className="m-0 text-sm font-extrabold text-text-primary" >
                Thử thách hàng ngày
              </h4>
              <p className="m-0 text-xs text-text-muted font-medium" >
                Luyện tập ngay để duy trì chuỗi Streak!
              </p>
            </div>
            <ChevronRight className="text-xs text-accent" />
          </m.button>
        )}

        {/* Actions button */}
        {onRestart && (
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart} className="h-[48px] rounded-(--radius-lg) border-none text-[15px] font-extrabold cursor-pointer flex items-center justify-center gap-2 mt-2.5" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", boxShadow: "0 4px 14px var(--accent-muted)"}} >
            <RefreshCw size={13} />
            Bắt đầu lượt ôn tập mới
          </m.button>
        )}
      </Flex>
    </>
  );
}
