"use client";

import { Image, Loader2, Mail, PenTool, Star } from "lucide-react";
import { useState } from "react";
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
    desc: "Respond to a written request (TOEIC Q6-7)",
    colorClass: "text-info",
    borderClass: "border-border hover:border-info",
    bgClass: "hover:bg-info/5 bg-surface",
    iconBgClass: "bg-info-bg text-info",
  },
  {
    id: "opinion-essay",
    icon: PenTool,
    desc: "Write an opinion essay (TOEIC Q8)",
    colorClass: "text-accent",
    borderClass: "border-border hover:border-accent",
    bgClass: "hover:bg-accent/5 bg-surface",
    iconBgClass: "bg-accent-muted text-accent",
  },
  {
    id: "describe-picture",
    icon: Image,
    desc: "Write a sentence based on a picture (TOEIC Q1-5)",
    colorClass: "text-warning",
    borderClass: "border-border hover:border-warning",
    bgClass: "hover:bg-warning/5 bg-surface",
    iconBgClass: "bg-warning-bg text-warning",
  },
  {
    id: "free",
    icon: Star,
    desc: "Free writing on any topic",
    colorClass: "text-success",
    borderClass: "border-border hover:border-success",
    bgClass: "hover:bg-success/5 bg-surface",
    iconBgClass: "bg-success-bg text-success",
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent text-text-on-accent text-2xl mb-3.5 border-2 border-border shadow">
          <PenTool className="h-6 w-6" />
        </div>
        <h2 className="m-0 text-xl font-bold font-display text-ink italic">Choose Writing Type</h2>
        <p className="m-0 mt-1.5 text-xs text-text-muted">
          Practice writing according to the TOEIC format
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
                style={{
                  backgroundColor: `var(--${cat.id === "email-response" ? "info" : cat.id === "opinion-essay" ? "accent" : cat.id === "describe-picture" ? "warning" : "success"})`,
                }}
              />

              {/* Icon */}
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.iconBgClass}`}
              >
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
                <div className="text-xs text-text-secondary leading-relaxed">{cat.desc}</div>
              </div>

              {isBusy && (
                <div
                  className="text-[11px] font-semibold mt-1 flex items-center gap-1.5"
                  style={{
                    color: `var(--${cat.id === "email-response" ? "info" : cat.id === "opinion-essay" ? "accent" : cat.id === "describe-picture" ? "warning" : "success"})`,
                  }}
                >
                  Generating prompt...
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
