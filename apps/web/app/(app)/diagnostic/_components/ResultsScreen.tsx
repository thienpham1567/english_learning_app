"use client";

import { Card, Flex, Typography, Tag } from "antd";

import { CEFR_COLORS } from "@/lib/constants/cefr";
import * as m from "motion/react-client";

import type { TestResult } from "./types";
import { CheckCircle, ChevronRight, Radar, RefreshCw } from "lucide-react";

const { Title, Text } = Typography;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe hiểu",
};

type Props = {
  result: TestResult;
  onGoHome: () => void;
  onViewProgress: () => void;
};

export function ResultsScreen({ result, onGoHome, onViewProgress }: Props) {
  const cefrColor = CEFR_COLORS[result.overallCefr] ?? "var(--accent)";

  return (
    <div className="h-full overflow-y-auto bg-bg-deep" style={{padding: "24px 20px 48px"}} >
      <Flex vertical gap={20} className="w-[600px] mx-auto" >
        
        {/* Hero result card */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }} className="rounded-(--radius-xl) border-2 border-border text-center relative overflow-hidden" style={{background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))", padding: "40px 24px", boxShadow: "var(--shadow-sm)"}} >
          {/* Radial ambient glow matching the CEFR level color */}
          <div className="absolute w-[280px] h-[280px] rounded-full" style={{left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: `radial-gradient(circle, ${cefrColor}12 0%, transparent 70%)`, pointerEvents: "none"}} />

          <CheckCircle className="anim-scale-in mb-4" style={{fontSize: 44, color: cefrColor}} />
          <Title level={4} className="mb-2.5 text-text-primary font-extrabold" >
            Hoàn thành đánh giá trình độ!
          </Title>
          
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 80 }} className="font-black font-display" style={{fontSize: 68, color: cefrColor, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "12px 0", textShadow: `0 8px 24px ${cefrColor}33`}} >
            {result.overallCefr}
          </m.div>

          <Flex justify="center" gap={12} className="mt-4" >
            <span className="rounded-full text-xs font-extrabold text-accent" style={{padding: "4px 14px", border: "1px solid var(--accent)", background: "var(--accent-light)", boxShadow: "var(--shadow-sm)"}} >
              Độ tin cậy: {Math.round(result.confidence * 100)}%
            </span>
            <span className="rounded-full text-xs font-extrabold text-(--xp)" style={{padding: "4px 14px", border: "1px solid var(--xp)", background: "rgba(245, 158, 11, 0.08)", boxShadow: "var(--shadow-sm)"}} >
              +{result.xpAwarded} XP nhận được
            </span>
          </Flex>
        </m.div>

        {/* Skill breakdown card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }} className="rounded-(--radius-xl) border-2 border-border bg-(--surface)" style={{padding: "20px", boxShadow: "var(--shadow-sm)"}} >
          <div className="flex items-center gap-2" style={{marginBottom: 18}} >
            <Radar className="text-sm text-accent" />
            <span className="text-[13px] font-extrabold text-text-primary font-display" >
              Chi tiết năng lực từng kỹ năng
            </span>
          </div>

          <Flex vertical gap={16}>
            {Object.entries(result.skills).map(([skill, skillResult], idx) => {
              const pct = Math.round(
                (skillResult.correct / Math.max(skillResult.total, 1)) * 100,
              );
              const skillColor = CEFR_COLORS[skillResult.cefr] ?? "var(--accent)";

              return (
                <div key={skill} className="flex flex-col gap-1.5" >
                  <Flex justify="space-between" align="center">
                    <span className="font-bold text-text-primary" style={{fontSize: 13.5}} >
                      {SKILL_LABELS[skill] ?? skill}
                    </span>
                    <Flex gap={8} align="center">
                      <span className="text-[11px] font-extrabold bg-surface-alt rounded-full" style={{color: skillColor, border: `1px solid ${skillColor}`, padding: "2px 8px"}} >
                        {skillResult.cefr}
                      </span>
                      <span className="text-text-muted font-semibold" style={{fontSize: 11.5}} >
                        {skillResult.correct}/{skillResult.total} ({pct}%)
                      </span>
                    </Flex>
                  </Flex>

                  {/* Custom Progress bar */}
                  <div className="h-[8px] rounded-full relative overflow-hidden" style={{background: "var(--border)"}} >
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + idx * 0.1, duration: 0.6, ease: "easeOut" }} className="absolute rounded-full" style={{left: 0, top: 0, bottom: 0, background: skillColor, boxShadow: `0 0 6px ${skillColor}33`}} />
                  </div>
                </div>
              );
            })}
          </Flex>
        </m.div>

        {/* Action button row */}
        <Flex gap={12}>
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome} className="flex-1 h-[48px] rounded-(--radius-lg) border-none text-[15px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", boxShadow: "0 4px 14px var(--accent-muted)"}} >
            Về trang chủ
            <ChevronRight size={11} />
          </m.button>
          
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewProgress} className="h-[48px] rounded-(--radius-lg) bg-surface-alt border-2 border-border text-text-secondary text-[15px] font-bold cursor-pointer flex items-center gap-1.5" style={{padding: "0 20px", boxShadow: "var(--shadow-sm)"}} >
            <RefreshCw size={13} />
            Xem tiến trình học
          </m.button>
        </Flex>
      </Flex>
    </div>
  );
}
