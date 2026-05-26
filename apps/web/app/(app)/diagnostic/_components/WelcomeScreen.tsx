"use client";

import { Card, Flex, Typography, Button, Tag } from "antd";

import { CEFR_COLORS } from "@/lib/constants/cefr";
import * as m from "motion/react-client";

import type { DiagnosticStatus } from "./types";
import {
  Calendar,
  ChevronRight,
  Clock,
  Info,
  PlayCircle,
  Trophy,
  Zap,
} from "lucide-react";

const { Text } = Typography;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe hiểu",
};

type Props = {
  status: DiagnosticStatus | null;
  onStart: () => void;
};

export function WelcomeScreen({ status, onStart }: Props) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-deep" >
      <div className="shrink-0" style={{padding: "20px 20px 0"}} >
        <div className="w-[600px] mx-auto" >
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{padding: "24px 20px 48px"}} >
        <Flex vertical gap={20} className="w-[600px] mx-auto" >
          
          {/* Test Info Cards Grid */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }} className="rounded-(--radius-xl) border border-(--border) bg-(--surface)" style={{padding: "20px", boxShadow: "var(--shadow-sm)"}} >
            <div className="flex items-center gap-2 mb-4" >
              <Info className="text-[13px] text-accent" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent" >
                Cấu trúc bài đánh giá
              </span>
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns: "1fr 1fr"}} >
              {[
                {
                  icon: "📝",
                  label: "30 câu hỏi",
                  desc: "10 Ngữ pháp + 10 Từ vựng + 5 Đọc + 5 Nghe",
                },
                {
                  icon: "🎯",
                  label: "Thích ứng thông minh",
                  desc: "Độ khó tự động tăng/giảm dựa vào câu trước",
                },
                {
                  icon: "⏱️",
                  label: "Khoảng 15 phút",
                  desc: "Không giới hạn thời gian mỗi câu hỏi",
                },
                {
                  icon: "📈",
                  label: "Xếp loại CEFR",
                  desc: "Đánh giá chi tiết trình độ A1 đến C2 kèm biểu đồ",
                },
              ].map((item, idx) => (
                <div
                  key={idx} className="bg-surface-alt rounded-(--radius-lg) border border-(--border) flex flex-col gap-1" style={{padding: "12px 14px"}} >
                  <span className="text-xl" style={{marginBottom: 2}} >{item.icon}</span>
                  <span className="text-[13px] font-extrabold text-text-primary" >{item.label}</span>
                  <span className="text-[11px] text-text-muted font-medium" style={{lineHeight: 1.4}} >{item.desc}</span>
                </div>
              ))}
            </div>
          </m.div>

          {/* Previous result */}
          {status?.hasResult && status.lastResult && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }} className="rounded-(--radius-xl) border border-(--border) bg-(--surface)" style={{padding: "20px", boxShadow: "var(--shadow-sm)"}} >
              <div className="flex items-center gap-2 mb-4" >
                <Trophy className="text-[13px] text-accent" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent" >
                  Kết quả đánh giá gần nhất
                </span>
              </div>

              <Flex vertical gap={14}>
                <Flex align="center" gap={14}>
                  <div className="text-4xl font-black bg-surface-alt w-[58px] h-[58px] rounded-full grid font-display" style={{color: CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)", border: `2px solid ${CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)"}`, placeItems: "center", boxShadow: `0 4px 12px ${CEFR_COLORS[status.lastResult.overallCefr]}33`}} >
                    {status.lastResult.overallCefr}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-text-primary" >
                      Trình độ {status.lastResult.overallCefr}
                    </div>
                    <div className="text-[11px] text-text-muted font-medium" style={{marginTop: 2}} >
                      Độ tin cậy: {Math.round(status.lastResult.confidence * 100)}% · Ngày kiểm tra: {new Date(status.lastResult.completedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </Flex>

                {/* Previous skill breakdown */}
                {status.lastResult.skillBreakdown && (
                  <div className="grid gap-2 mt-1 p-3 rounded-(--radius-lg) bg-surface-alt border border-(--border)" style={{gridTemplateColumns: "1fr 1fr"}} >
                    {Object.entries(status.lastResult.skillBreakdown).map(
                      ([skill, sr]) => {
                        const skillColor = CEFR_COLORS[sr.cefr] ?? "var(--accent)";
                        return (
                          <div
                            key={skill} className="flex items-center justify-between" >
                            <span className="text-xs font-semibold text-text-secondary" >
                              {SKILL_LABELS[skill] ?? skill}
                            </span>
                            <span className="text-[11px] font-extrabold bg-(--surface) rounded-full" style={{color: skillColor, border: `1px solid ${skillColor}`, padding: "2px 8px"}} >
                              {sr.cefr} ({sr.correct}/{sr.total})
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </Flex>
            </m.div>
          )}

          {/* Start button / CD */}
          {status?.canRetake !== false ? (
            <m.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart} className="w-full h-[52px] rounded-(--radius-xl) border-none text-base font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", boxShadow: "0 6px 20px var(--accent-muted)"}} >
              <PlayCircle />
              {status?.hasResult ? "Bắt đầu làm lại bài đánh giá" : "Bắt đầu bài đánh giá"}
              <ChevronRight size={12} />
            </m.button>
          ) : (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }} className="rounded-(--radius-xl) bg-surface-alt border border-(--border) text-center" style={{padding: "20px"}} >
              <Clock className="text-3xl text-text-muted mb-2" />
              <div className="text-[13px] text-text-secondary font-semibold" >
                Bạn đã hoàn thành bài test gần đây. Hãy ôn tập thêm và thử lại sau{" "}
                <span className="text-accent font-extrabold" >{status?.daysUntilRetake}</span> ngày nữa!
              </div>
            </m.div>
          )}
        </Flex>
      </div>
    </div>
  );
}
