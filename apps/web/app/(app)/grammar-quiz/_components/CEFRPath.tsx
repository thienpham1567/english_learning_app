"use client";

import { Button, Segmented, Switch } from "antd";
import * as m from "motion/react-client";
import {
  BookOpen,
  Check,
  Clock,
  Loader2,
  Rocket,
  Zap,
} from "lucide-react";

const CEFR_LEVELS = [
  { id: "A1", tier: "easy", label: "A1", desc: "Cơ bản" },
  { id: "A2", tier: "easy", label: "A2", desc: "Sơ cấp" },
  { id: "B1", tier: "medium", label: "B1", desc: "Trung cấp" },
  { id: "B2", tier: "medium", label: "B2", desc: "Khá" },
  { id: "C1", tier: "hard", label: "C1", desc: "Nâng cao" },
  { id: "C2", tier: "hard", label: "C2", desc: "Thành thạo" },
] as const;

const TIER_COLORS: Record<string, string> = {
  easy: "var(--success)",
  medium: "var(--accent)",
  hard: "var(--error)",
};

const TIER_GLOWS: Record<string, string> = {
  easy: "rgba(16, 185, 129, 0.2)",
  medium: "color-mix(in srgb, var(--accent) 20%, transparent)",
  hard: "rgba(239, 68, 68, 0.2)",
};

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
  timedMode?: boolean;
  onTimedModeChange?: (val: boolean) => void;
  sourceMode?: "ai" | "ets";
  onSourceModeChange?: (val: "ai" | "ets") => void;
};

export function CEFRPath({
  selected,
  onSelect,
  onStart,
  isLoading,
  timedMode,
  onTimedModeChange,
  sourceMode = "ai",
  onSourceModeChange,
}: Props) {
  const isEts = sourceMode === "ets";
  return (
    <div className="anim-fade-up w-[480px] mx-auto text-center bg-(--surface) rounded-(--radius-xl) border-2 border-border relative overflow-hidden" style={{padding: "32px 24px", boxShadow: "var(--shadow-sm)"}} >
      <div className="absolute w-[180px] h-[180px] rounded-full" style={{left: "50%", top: "0%", transform: "translateX(-50%)", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", pointerEvents: "none"}} />

      <h3 className="text-xl font-black font-display text-text-primary m-0" >
        TOEIC Part 5 Quiz
      </h3>
      <p className="mt-1 text-[13px] text-text-secondary font-medium" >
        Luyện tập trắc nghiệm Part 5 với câu hỏi biên soạn chuẩn đề thi
      </p>

      {/* Source mode toggle */}
      {onSourceModeChange && (
        <div className="mt-5 mb-1 relative z-[1]" >
          <Segmented value={sourceMode} onChange={(val) => onSourceModeChange(val as "ai" | "ets")} options={[ { value: "ai", label: ( <div className="flex items-center justify-center gap-1.5 font-bold rounded-(--radius-lg) border-2 border-border bg-surface-alt" style={{padding: "4px 12px"}} > <Zap size={13} /> <span>AI tạo đề</span> </div> ), }, { value: "ets", label: ( <div className="flex items-center justify-center gap-1.5 font-bold rounded-(--radius-lg) border-2 border-border bg-surface-alt" style={{padding: "4px 12px"}} > <BookOpen size={13} /> <span>Đề ETS thật</span> </div> ), }, ]} />
          {isEts && (
            <p className="mt-2 text-text-muted font-semibold" style={{fontSize: 11.5}} >
              240 câu hỏi trích xuất từ đề thi ETS thật · Tự động trộn ngẫu nhiên
            </p>
          )}
        </div>
      )}

      {/* CEFR Path */}
      <div className="mt-6" style={{opacity: isEts ? 0.35 : 1, pointerEvents: isEts ? "none" : "auto", transition: "opacity 0.2s"}} >
        <div className="flex items-start justify-center" style={{gap: 0, padding: "4px 0 12px"}} >
          {CEFR_LEVELS.map((level, i) => {
            const isSelected = selected === level.tier;
            const tierColor = TIER_COLORS[level.tier];
            const isLast = i === CEFR_LEVELS.length - 1;

            return (
              <div key={level.id} className="flex items-center" >
                {/* Node wrapper */}
                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => onSelect(level.tier)} className="flex flex-col items-center gap-1.5 bg-none border-none cursor-pointer" style={{padding: "0"}} >
                  <div className="w-[32px] h-[32px] rounded-full grid" style={{border: `2px solid ${isSelected ? tierColor : "var(--border)"}`, background: isSelected ? tierColor : "var(--surface-alt)", placeItems: "center", boxShadow: isSelected ? `0 0 10px ${TIER_GLOWS[level.tier]}` : "none", transition: "all 0.2s ease"}} >
                    {isSelected ? (
                      <Check className="text-xs font-black" style={{color: "var(--text-on-accent)"}} />
                    ) : (
                      <span className="text-[10px] font-extrabold text-text-muted" >
                        {level.label}
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] font-extrabold" style={{color: isSelected ? tierColor : "var(--text-muted)", transition: "color 0.2s"}} >
                    {level.desc}
                  </span>
                </m.button>

                {/* Line */}
                {!isLast && (
                  <div className="w-[24px] h-[2px] rounded-full" style={{alignSelf: "flex-start", marginTop: 15, background: isSelected && CEFR_LEVELS[i + 1]?.tier === level.tier
                          ? tierColor
                          : "var(--border)"}} />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-2 font-extrabold" style={{fontSize: 12.5, color: TIER_COLORS[selected] ?? "var(--text-secondary)"}} >
          {selected === "easy" && "Độ khó: Ngữ pháp cơ bản (A1–A2)"}
          {selected === "medium" && "Độ khó: Ngữ pháp trung cấp (B1–B2)"}
          {selected === "hard" && "Độ khó: Ngữ pháp nâng cao (C1–C2)"}
        </p>
      </div>

      {/* Timer switches */}
      {onTimedModeChange && (
        <div className="mt-5 flex items-center justify-center gap-2.5 pt-4" style={{borderTop: "1.5px dashed var(--border)"}} >
          <Clock className="text-sm" style={{color: timedMode ? "var(--accent)" : "var(--text-muted)"}} />
          <span className="text-[13px] text-text-secondary font-bold" >
            Tính giờ làm bài
          </span>
          <Switch size="small" checked={timedMode} onChange={onTimedModeChange} />
          {timedMode && (
            <span className="text-text-muted font-semibold" style={{fontSize: 11.5}} >
              (30s / câu hỏi)
            </span>
          )}
        </div>
      )}

      {/* Start Button */}
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        disabled={isLoading} className="mt-6 h-[44px] w-full rounded-(--radius-lg) border-none font-extrabold cursor-pointer flex items-center justify-center gap-1.5" style={{background: "linear-gradient(135deg, var(--accent), var(--secondary))", color: "var(--text-on-accent)", fontSize: 14.5, boxShadow: "0 4px 12px var(--accent-muted)"}} >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" /> Đang lập đề...
          </>
        ) : (
          <>
            <Rocket /> Bắt đầu luyện đề
          </>
        )}
      </m.button>
    </div>
  );
}
