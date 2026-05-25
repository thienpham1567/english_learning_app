"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Rocket,
  Lightbulb,
  Clock,
  ArrowRight,
  Book,
  Star,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
type ReadingMode = "overview" | "strategy" | "drill";

type StrategyItem = {
  id: string;
  part: string;
  title: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  color: string;
};

type DrillOption = {
  part: string;
  label: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  href: string;
};

// ── Data ─────────────────────────────────────────────────────────

const STRATEGIES: StrategyItem[] = [
  {
    id: "part5", part: "Part 5", title: "Incomplete Sentences",
    description: "Chọn từ/cụm từ đúng để hoàn thành câu. 30 câu, tập trung ngữ pháp và từ vựng.",
    tips: [
      "Đọc cả câu trước khi chọn — đừng chỉ nhìn chỗ trống",
      "Xác định loại từ cần điền (noun/verb/adj/adv) bằng cấu trúc câu",
      "Tìm collocations và fixed phrases quen thuộc",
      "Dành tối đa 20 giây/câu — Part 5 cần nhanh để dành thời gian cho Part 7",
    ],
    icon: <Lightbulb className="h-5 w-5" />, color: "var(--accent)",
  },
  {
    id: "part6", part: "Part 6", title: "Text Completion",
    description: "Hoàn thành đoạn văn với từ/câu phù hợp. 4 đoạn × 4 câu hỏi.",
    tips: [
      "Đọc TOÀN BỘ đoạn văn trước — ngữ cảnh rất quan trọng",
      "Câu hỏi chèn câu: chú ý linking words và logical flow",
      "Phân biệt thì (tense) dựa vào time markers trong đoạn",
      "Dành khoảng 2 phút/đoạn (8 phút tổng cho Part 6)",
    ],
    icon: <BookOpen className="h-5 w-5" />, color: "var(--secondary)",
  },
  {
    id: "part7", part: "Part 7", title: "Reading Comprehension",
    description: "Đọc hiểu — single passage, double passage, triple passage. 54 câu hỏi.",
    tips: [
      "ĐỌC CÂU HỎI TRƯỚC rồi mới đọc bài — tiết kiệm thời gian cực kỳ hiệu quả",
      "Với double/triple passage: tìm mối liên hệ giữa các bài",
      "Câu 'What is suggested/implied?' — tìm paraphrasing, không tìm exact words",
      "Phân bổ thời gian: ~1 phút/câu cho Part 7, bắt đầu từ single passages",
    ],
    icon: <Book className="h-5 w-5" />, color: "var(--info)",
  },
];

const DRILLS: DrillOption[] = [
  { part: "Part 5", label: "Quick Drill · Part 5", description: "30 câu Incomplete Sentences", questionCount: 10, estimatedMinutes: 5, href: "/toeic/practice" },
  { part: "Part 6", label: "Quick Drill · Part 6", description: "4 đoạn Text Completion", questionCount: 16, estimatedMinutes: 8, href: "/toeic/practice" },
  { part: "Part 7", label: "Quick Drill · Part 7", description: "Single + Double passages", questionCount: 15, estimatedMinutes: 15, href: "/toeic/practice" },
  { part: "Full", label: "Full Reading Test", description: "Part 5 + 6 + 7 (75 phút)", questionCount: 100, estimatedMinutes: 75, href: "/toeic/practice" },
];

// ── Component ────────────────────────────────────────────────────
export function ReadingTab() {
  const [mode, setMode] = useState<ReadingMode>("overview");
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  return (
    <div className="px-3.5 pt-3 pb-10 max-w-3xl mx-auto w-full">

      {/* Mode selector pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "overview" as ReadingMode, label: "Tổng quan", icon: <Book className="h-4 w-4" /> },
          { key: "strategy" as ReadingMode, label: "Chiến lược", icon: <Lightbulb className="h-4 w-4" /> },
          { key: "drill" as ReadingMode, label: "Luyện tập", icon: <Rocket className="h-4 w-4" /> },
        ].map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
              mode === m.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-slate-450 hover:border-slate-800 hover:text-slate-200"
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview Mode ── */}
      {mode === "overview" && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Quick stats */}
          <div className="rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 p-5 relative overflow-hidden shadow-md text-white">
            <h3 className="m-0 mb-2 text-lg font-extrabold font-display">
              TOEIC Reading Section
            </h3>
            <p className="m-0 mb-3.5 text-xs text-slate-350 leading-relaxed">
              75 phút · 100 câu hỏi · 3 phần (Part 5, 6, 7) · Tối đa 495 điểm
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { part: "Part 5", q: "30 câu", desc: "Incomplete Sentences" },
                { part: "Part 6", q: "16 câu", desc: "Text Completion" },
                { part: "Part 7", q: "54 câu", desc: "Reading Comprehension" },
              ].map(p => (
                <div key={p.part} className="flex-1 min-w-[100px] p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs font-bold text-slate-100">{p.part}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{p.q} · {p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("strategy")}
              className="rounded-2xl border border-border bg-accent/5 p-5 text-left transition-all hover:scale-[1.01] hover:border-accent hover:bg-accent/10 duration-150 cursor-pointer shadow-xs"
            >
              <Lightbulb className="h-6 w-6 text-accent mb-2" />
              <div className="text-sm font-bold text-ink">Chiến lược làm bài</div>
              <div className="text-[11px] text-slate-450 mt-1">Tips cho từng Part</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("drill")}
              className="rounded-2xl border border-border bg-(--secondary)/5 p-5 text-left transition-all hover:scale-[1.01] hover:border-(--secondary) hover:bg-(--secondary)/10 duration-150 cursor-pointer shadow-xs"
            >
              <Rocket className="h-6 w-6 text-(--secondary) mb-2" />
              <div className="text-sm font-bold text-ink">Quick Drill</div>
              <div className="text-[11px] text-slate-450 mt-1">Luyện từng Part riêng</div>
            </button>
          </div>

          {/* Full practice CTA */}
          <Link href="/toeic/practice" className="no-underline block group">
            <div className="rounded-2xl border border-border bg-linear-to-br from-(--accent)/5 to-(--secondary)/5 p-5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all duration-200 group-hover:border-(--accent)/40">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-(--accent)/10 text-(--accent) text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-ink">Luyện đề ETS chính hãng</div>
                <div className="text-xs text-slate-450 mt-0.5">1,320 câu hỏi từ ETS 2020-2021</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      )}

      {/* ── Strategy Mode ── */}
      {mode === "strategy" && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent mb-1 flex items-center gap-2">
            <div className="w-1 h-3.5 rounded bg-(--accent)" />
            <span>Chiến lược từng phần</span>
          </div>

          {STRATEGIES.map(s => {
            const isExpanded = expandedStrategy === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setExpandedStrategy(isExpanded ? null : s.id)}
                className="rounded-2xl border border-border bg-surface p-5 relative overflow-hidden transition-all duration-150 shadow-xs cursor-pointer text-left w-full block active:scale-99"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                  style={{ backgroundColor: s.color }}
                />
                <div className={`flex items-center gap-3 ${isExpanded ? "mb-4.5" : ""}`}>
                  <div
                    className="w-9.5 h-9.5 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${s.color} 10%, var(--surface))`,
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink">{s.part} — {s.title}</div>
                    <div className="text-xs text-slate-455 mt-0.5 truncate">{s.description}</div>
                  </div>
                  <ArrowRight
                    className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : "rotate-0"
                    }`}
                  />
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-2 pl-[42px] animate-in fade-in slide-in-from-top-1 duration-150">
                    {s.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-start p-2.5 rounded-xl bg-slate-900/40 border border-slate-850/60 text-xs text-slate-350 leading-relaxed"
                      >
                        <Star className="h-3 w-3 text-current shrink-0 fill-current mt-0.5" style={{ color: s.color }} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Drill Mode ── */}
      {mode === "drill" && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent mb-1 flex items-center gap-2">
            <div className="w-1 h-3.5 rounded bg-(--accent)" />
            <span>Chọn bài luyện</span>
          </div>

          {DRILLS.map(d => (
            <Link key={d.label} href={d.href} className="no-underline block group">
              <div className="rounded-2xl border border-border bg-surface p-4.5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all duration-150 group-hover:border-accent/40">
                <div
                  className={`w-10.5 h-10.5 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    d.part === "Full"
                      ? "bg-linear-to-br from-(--accent) to-(--secondary) text-white"
                      : "bg-(--accent)/10 text-(--accent)"
                  }`}
                >
                  {d.part === "Full" ? <Trophy className="h-4.5 w-4.5" /> : <Rocket className="h-4.5 w-4.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink">{d.label}</div>
                  <div className="text-xs text-slate-450 mt-0.5 truncate">
                    {d.description}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-(--accent)">{d.questionCount} câu</div>
                  <div className="text-[10px] text-slate-450 flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{d.estimatedMinutes}p</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
