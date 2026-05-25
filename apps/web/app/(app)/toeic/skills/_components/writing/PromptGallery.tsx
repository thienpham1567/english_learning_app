"use client";

import { useState } from "react";
import { Mail, PenTool, Image, Star, Loader2 } from "lucide-react";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS } from "@/lib/writing-practice/types";

const CATEGORIES: {
  id: WritingCategory;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  iconBgClass: string;
}[] = [
  {
    id: "email-response",
    icon: Mail,
    desc: "Trả lời email yêu cầu (TOEIC Q6-7)",
    colorClass: "text-(--info)",
    borderClass: "border-slate-800 hover:border-(--info)/40",
    bgClass: "hover:bg-(--info)/5 bg-surface",
    iconBgClass: "bg-blue-500/10 text-blue-400",
  },
  {
    id: "opinion-essay",
    icon: PenTool,
    desc: "Viết luận trình bày quan điểm (TOEIC Q8)",
    colorClass: "text-(--accent)",
    borderClass: "border-slate-800 hover:border-(--accent)/40",
    bgClass: "hover:bg-(--accent)/5 bg-surface",
    iconBgClass: "bg-accent/10 text-accent",
  },
  {
    id: "describe-picture",
    icon: Image,
    desc: "Mô tả hình ảnh bằng câu (TOEIC Q1-5)",
    colorClass: "text-(--warning)",
    borderClass: "border-slate-800 hover:border-(--warning)/40",
    bgClass: "hover:bg-(--warning)/5 bg-surface",
    iconBgClass: "bg-amber-500/10 text-amber-400",
  },
  {
    id: "free",
    icon: Star,
    desc: "Tự do sáng tạo, chủ đề bất kỳ",
    colorClass: "text-(--success)",
    borderClass: "border-slate-800 hover:border-(--success)/40",
    bgClass: "hover:bg-(--success)/5 bg-surface",
    iconBgClass: "bg-emerald-500/10 text-emerald-450",
  },
];

type Props = {
  onSelect: (category: WritingCategory) => void;
  isLoading: boolean;
  loadingCategory: string | null;
};

export function PromptGallery({ onSelect, isLoading, loadingCategory }: Props) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-5 py-6">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-accent to-accent-hover text-white text-2xl mb-3.5 shadow-md shadow-accent/20">
          <PenTool className="h-6 w-6" />
        </div>
        <h2 className="m-0 text-xl font-bold font-display text-ink italic">
          Chọn loại bài viết
        </h2>
        <p className="m-0 mt-1.5 text-xs text-slate-455">
          Luyện viết theo format TOEIC Speaking &amp; Writing
        </p>
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 w-full">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isBusy = isLoading && loadingCategory === cat.id;

          return (
            <button
              key={cat.id}
              disabled={isLoading}
              onClick={() => onSelect(cat.id)}
              className={`flex flex-col items-start gap-2.5 p-4.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 relative overflow-hidden active:scale-97 block w-full ${
                cat.borderClass
              } ${cat.bgClass} ${isLoading ? "opacity-55 cursor-not-allowed" : "hover:-translate-y-0.5 shadow-xs"}`}
            >
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: `var(--${cat.id === "email-response" ? "info" : cat.id === "opinion-essay" ? "accent" : cat.id === "describe-picture" ? "warning" : "success"})` }}
              />

              {/* Icon */}
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.iconBgClass}`}>
                {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>

              {/* Label */}
              <div>
                <div className="text-sm font-bold text-ink leading-tight mb-1">
                  {CATEGORY_LABELS[cat.id]}
                </div>
                <div className="text-xs text-slate-455 leading-relaxed">
                  {cat.desc}
                </div>
              </div>

              {isBusy && (
                <div className="text-[11px] font-semibold mt-1 flex items-center gap-1.5" style={{ color: `var(--${cat.id === "email-response" ? "info" : cat.id === "opinion-essay" ? "accent" : cat.id === "describe-picture" ? "warning" : "success"})` }}>
                  Đang tạo đề...
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
