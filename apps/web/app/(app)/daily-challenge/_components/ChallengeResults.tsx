"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";

import Link from "next/link";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  ArrowLeftRight,
  BookOpenText,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  HelpCircle,
  Languages,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Pencil,
  Search,
  Square,
  Star,
  Trophy,
  Type,
  XCircle,
  Zap,
} from "lucide-react";;

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, label: "Hoàn hảo! 🌟", sub: "Tất cả câu trả lời đều chính xác" },
  { min: 4, tier: "medium" as const, label: "Xuất sắc! 🎉", sub: "Gần như tuyệt đối" },
  { min: 3, tier: "small" as const, label: "Tốt lắm! 👍", sub: "Bạn đang tiến bộ rất nhanh" },
  { min: 0, tier: null, label: "Cố gắng lên! 💪", sub: "Luyện tập thêm để đạt điểm tuyệt đối nhé" },
];

/* ── Exercise type maps ── */
const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  "fill-in-blank": <Pencil />,
  "sentence-order": <ArrowLeftRight />,
  "translation": <Languages />,
  "error-correction": <Search />,
  "word-formation": <Type />,
  "dialogue-completion": <MessageSquare />,
  "synonym-antonym": <LinkIcon />,
  "reading-comprehension": <BookOpenText />,
  "collocation": <Square />,
};

const EXERCISE_LABELS: Record<string, string> = {
  "fill-in-blank": "Điền từ vào chỗ trống",
  "sentence-order": "Sắp xếp thứ tự câu",
  "translation": "Dịch thuật câu",
  "error-correction": "Tìm và sửa lỗi sai",
  "word-formation": "Cấu tạo từ vựng",
  "dialogue-completion": "Hoàn thành hội thoại",
  "synonym-antonym": "Từ đồng / trái nghĩa",
  "reading-comprehension": "Đọc hiểu văn bản",
  "collocation": "Kết hợp từ (Collocation)",
};

/* ── Answer Detail Card ── */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const ok = answer.isCorrect;
  const exerciseIcon = answer.exerciseType ? EXERCISE_ICONS[answer.exerciseType] : <HelpCircle />;
  const exerciseLabel = answer.exerciseType ? EXERCISE_LABELS[answer.exerciseType] : "";

  const fetchAIExplanation = useCallback(async () => {
    if (aiExplanation || aiLoading) return;
    setAiLoading(true);
    try {
      const data = await api.post<{ explanation: string }>("/daily-challenge/explain", {
        exercise: { type: answer.exerciseType, instruction: "", data: answer.questionStem },
        userAnswer: answer.answer,
        isCorrect: answer.isCorrect,
      });
      setAiExplanation(data.explanation);
    } catch {
      setAiExplanation("Không thể kết nối máy chủ AI để lấy giải thích. Vui lòng thử lại sau.");
    } finally {
      setAiLoading(false);
    }
  }, [answer, aiExplanation, aiLoading]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index + 1, 6) * 0.08 }} className="rounded-(--radius-lg) bg-(--surface) overflow-hidden" style={{border: `1px solid ${ok ? "rgba(16, 185, 129, 0.22)" : "rgba(239, 68, 68, 0.18)"}`, boxShadow: "var(--shadow-sm)"}} >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)} className="flex items-center justify-between w-full border-none cursor-pointer gap-3" style={{padding: "14px 18px", background: ok ? "rgba(16, 185, 129, 0.03)" : "rgba(239, 68, 68, 0.02)"}} >
        <div className="flex items-center gap-3 w-[0px]" >
          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{background: ok ? "var(--success)" : "var(--error)", boxShadow: ok ? "0 0 8px var(--success)" : "0 0 8px var(--error)"}} />
          <div className="flex flex-col items-start w-[0px]" style={{gap: 2}} >
            <span className="font-body text-sm font-bold text-text-primary" >
              Câu số {index + 1}
            </span>
            {exerciseLabel && (
              <span className="items-center text-[11px] text-text-muted font-medium" style={{display: "inline-flex", gap: 5}} >
                {exerciseIcon} {exerciseLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0" >
          <span className="text-[11px] font-extrabold" style={{padding: "4px 10px", borderRadius: 20, background: ok ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.1)", color: ok ? "var(--success)" : "var(--error)"}} >
            {ok ? "Chính xác" : "Chưa đúng"}
          </span>
          <ChevronDown className="text-[10px] text-text-muted" style={{transition: "transform 0.25s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0)"}} />
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden" >
            <div className="flex flex-col gap-2.5" style={{padding: "4px 18px 18px"}} >
              {/* Question stem */}
              {answer.questionStem && (
                <div className="rounded-(--radius) bg-surface-alt border border-(--border)" style={{padding: "12px 14px"}} >
                  <span className="text-[10px] font-extrabold uppercase text-text-muted block mb-1.5" style={{letterSpacing: ".08em"}} >
                    Đề bài câu hỏi
                  </span>
                  <span className="text-sm text-text-primary font-medium" style={{lineHeight: 1.7, wordBreak: "break-word"}} >
                    {answer.questionStem}
                  </span>
                </div>
              )}

              {/* User answer */}
              <div className="rounded-(--radius)" style={{borderLeft: `3px solid ${ok ? "var(--success)" : "var(--error)"}`, padding: "11px 14px", background: ok
                    ? "rgba(16, 185, 129, 0.06)"
                    : "rgba(239, 68, 68, 0.05)"}} >
                <span className="text-[10px] font-extrabold uppercase block mb-1" style={{letterSpacing: ".08em", color: ok ? "var(--success)" : "var(--error)"}} >
                  {ok ? "Đáp án của bạn" : "Đáp án bạn chọn"}
                </span>
                <span className="font-semibold text-text-primary font-body" style={{fontSize: 13.5, wordBreak: "break-word"}} >
                  {answer.answer || "(bỏ trống)"}
                </span>
              </div>

              {/* Correct answer (wrong only) */}
              {!ok && answer.correctAnswer && (
                <div className="rounded-(--radius)" style={{borderLeft: "3px solid var(--success)", padding: "11px 14px", background: "rgba(16, 185, 129, 0.06)"}} >
                  <span className="text-[10px] font-extrabold uppercase text-emerald-500 block mb-1" style={{letterSpacing: ".08em"}} >
                    Đáp án đúng chuẩn
                  </span>
                  <span className="font-bold text-emerald-500 font-body" style={{fontSize: 13.5, wordBreak: "break-word"}} >
                    {answer.correctAnswer}
                  </span>
                </div>
              )}

              {/* Static explanation */}
              {answer.explanation && (
                <div className="flex gap-2 items-start" style={{padding: "6px 2px"}} >
                  <Lightbulb className="text-accent text-[13px] shrink-0" style={{marginTop: 2}} />
                  <p className="leading-relaxed text-text-secondary m-0" style={{fontSize: 12.5, wordBreak: "break-word"}} >
                    {answer.explanation}
                  </p>
                </div>
              )}

              {/* AI Explanation Button */}
              {!aiExplanation && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fetchAIExplanation(); }}
                  disabled={aiLoading} className="items-center gap-1.5 py-2 px-4 rounded-full text-accent text-xs font-bold mt-1" style={{display: "inline-flex", border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))", background: "color-mix(in srgb, var(--accent) 8%, var(--surface))", cursor: aiLoading ? "wait" : "pointer", width: "fit-content"}} >
                  {aiLoading ? (
                    <><Loader2 className="animate-spin" size={12} /> AI đang phân tích...</>
                  ) : (
                    <><Lightbulb size={12} /> Hỏi AI giải thích chi tiết</>
                  )}
                </m.button>
              )}

              {/* AI Explanation Content */}
              {aiExplanation && (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }} className="mt-1.5 rounded-(--radius-lg)" style={{padding: "14px", background: "linear-gradient(135deg, var(--accent-light), var(--surface-alt))", border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))"}} >
                  <div className="flex items-center gap-1.5 mb-2" >
                    <Lightbulb size={13} className="text-accent" />
                    <span className="text-[11px] font-extrabold uppercase text-accent" style={{letterSpacing: ".05em"}} >
                      Giải thích từ trợ lý AI
                    </span>
                  </div>
                  <p className="text-[13px] text-text-primary m-0 font-body" style={{lineHeight: 1.7, wordBreak: "break-word"}} >
                    {aiExplanation}
                  </p>
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/* ── Main Results Component ── */
type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

export function ChallengeResults({
  answers,
  score,
  streak,
  badges,
  newBadges,
  timeElapsedMs,
}: Props) {
  const matched = TIERS.find((t) => score >= t.min)!;
  const [showCelebration, setShowCelebration] = useState(matched.tier !== null);

  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <>
      {matched.tier && (
        <CelebrationOverlay
          tier={matched.tier}
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        >
          <span className="font-display text-3xl font-extrabold" style={{color: matched.tier === "big" ? "var(--xp)" : "var(--accent)"}} >
            {matched.label}
          </span>
        </CelebrationOverlay>
      )}

      <div className="anim-scale-in w-[540px] mx-auto w-full flex flex-col gap-4" >
        {/* ── Score Hero Card ── */}
        <div className="rounded-(--radius-xl) border border-(--border) bg-(--surface) text-center relative overflow-hidden" style={{padding: "36px 24px 28px", boxShadow: "var(--shadow-md)"}} >
          {/* Top accent line */}
          <div className="absolute h-[4px]" style={{top: 0, left: 0, right: 0, background: `linear-gradient(90deg, var(--accent), var(--xp))`}} />

          {/* Big score number */}
          <div className="flex items-baseline justify-center gap-1 mb-2" >
            <m.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 80, damping: 10 }} className="font-display font-black leading-none" style={{fontSize: 96, color: correctCount === answers.length
                  ? "var(--success)"
                  : correctCount >= answers.length * 0.6
                  ? "var(--text-primary)"
                  : "var(--accent)", letterSpacing: "-.04em"}} >
              {correctCount}
            </m.span>
            <span className="font-display text-4xl font-normal text-text-muted mb-2" style={{letterSpacing: "-.02em"}} >
              /{answers.length}
            </span>
          </div>

          {/* Title */}
          <p className="font-display text-3xl font-extrabold text-text-primary" style={{margin: "0 0 6px"}} >
            {matched.label}
          </p>
          <p className="font-body text-text-muted m-0 font-medium" style={{fontSize: 13.5}} >
            {matched.sub} · Độ chính xác {pct}%
          </p>

          {/* Divider */}
          <div className="w-[50px] h-[1px]" style={{margin: "20px auto", background: "var(--border)"}} />

          {/* Stats Grid */}
          <div className="grid gap-2" style={{gridTemplateColumns: "repeat(4, 1fr)"}} >
            {[
              { icon: <CheckCircle className="text-emerald-500" />, label: "Đúng", value: correctCount },
              { icon: <XCircle className="text-destructive" />, label: "Sai", value: wrongCount },
              { icon: <Clock className="text-accent" />, label: "Thời gian", value: `${minutes}:${seconds.toString().padStart(2, "0")}` },
              { icon: <Flame style={{ color: "var(--fire)" }} />, label: "Chuỗi ngày", value: streak.currentStreak },
            ].map((s, i) => (
              <div
                key={s.label} className="flex flex-col items-center gap-1 rounded-(--radius) bg-surface-alt border border-(--border)" style={{padding: "10px 4px"}} >
                <span className="text-base" >{s.icon}</span>
                <span className="font-mono text-base font-extrabold text-text-primary" style={{lineHeight: 1.2}} >
                  {s.value}
                </span>
                <span className="text-[9px] font-bold uppercase text-text-muted" style={{letterSpacing: ".05em"}} >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Badges ── */}
        {newBadges.length > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} className="rounded-(--radius-xl) py-4 px-5" style={{border: "1.5px solid rgba(245, 158, 11, 0.35)", background: "rgba(245, 158, 11, 0.06)", boxShadow: "var(--shadow-sm)"}} >
            <div className="flex items-center gap-1.5 mb-3" >
              <Star size={13} className="text-(--xp)" />
              <span className="text-[11px] font-extrabold uppercase text-(--xp)" style={{letterSpacing: ".08em"}} >
                Mở khóa huy hiệu mới!
              </span>
            </div>
            <div className="flex gap-2 flex-wrap" >
              {newBadges.map((b, i) => (
                <span
                  key={b.id} className="items-center gap-1.5 text-[13px] rounded-full bg-(--surface) font-bold text-text-primary" style={{display: "inline-flex", padding: "6px 16px", border: "1px solid rgba(245, 158, 11, 0.4)", boxShadow: "var(--shadow-sm)"}} >
                  {b.icon === "Trophy" ? (
                    <Trophy className="text-(--xp)" />
                  ) : (
                    <Flame className="text-(--xp)" />
                  )}
                  {b.label}
                </span>
              ))}
            </div>
          </m.div>
        )}

        {/* ── Answer Breakdown header ── */}
        <div className="flex items-center gap-3 mt-2.5" >
          <span className="text-[11px] font-extrabold uppercase text-text-muted" style={{letterSpacing: ".08em", whiteSpace: "nowrap"}} >
            Chi tiết các câu trả lời
          </span>
          <div className="flex-1 h-[1px]" style={{background: "var(--border)"}} />
        </div>

        {/* Answer Cards */}
        <div className="flex flex-col gap-2.5" >
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </div>

        {/* Badges Gallery */}
        <div>
          <BadgeGallery badges={badges} />
        </div>

        {/* CTA */}
        <div className="mt-2.5 flex flex-col items-center gap-3" >
          <Link
            href="/daily-challenge"
            prefetch={false} className="items-center justify-center gap-2 w-full rounded-(--radius-lg) font-extrabold text-[15px]" style={{display: "inline-flex", padding: "14px 28px", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", textDecoration: "none", boxShadow: "0 6px 18px var(--accent-muted)", transition: "all 0.2s"}} >
            Hoàn tất & Tiếp tục
            <ChevronRight size={12} />
          </Link>
          <span className="text-[11px] text-text-muted font-medium" >
            Quay lại mai nhé!
          </span>
        </div>
      </div>
    </>
  );
}
