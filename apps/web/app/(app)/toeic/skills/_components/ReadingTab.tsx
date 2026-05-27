"use client";

import { ArrowRight, Book, BookOpen, Clock, Lightbulb, Rocket, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
    id: "part5",
    part: "Part 5",
    title: "Incomplete Sentences",
    description: "Choose the correct word/phrase to complete the sentence. 30 questions, focused on grammar and vocabulary.",
    tips: [
      "Read the whole sentence before choosing — don't just look at the blank",
      "Determine the part of speech needed (noun/verb/adj/adv) using sentence structure",
      "Identify common collocations and fixed phrases",
      "Spend at most 20 seconds per question — Part 5 needs speed to save time for Part 7",
    ],
    icon: <Lightbulb className="h-5 w-5" />,
    color: "var(--accent)",
  },
  {
    id: "part6",
    part: "Part 6",
    title: "Text Completion",
    description: "Complete the passages with the correct word/phrase/sentence. 4 passages × 4 questions.",
    tips: [
      "Read the ENTIRE passage first — context is extremely important",
      "Sentence insertion questions: pay attention to linking words and logical flow",
      "Distinguish tenses using time markers in the passage",
      "Spend about 2 minutes per passage (8 minutes total for Part 6)",
    ],
    icon: <BookOpen className="h-5 w-5" />,
    color: "var(--secondary)",
  },
  {
    id: "part7",
    part: "Part 7",
    title: "Reading Comprehension",
    description: "Reading Comprehension — single, double, and triple passages. 54 questions.",
    tips: [
      "READ THE QUESTIONS FIRST before reading the passage — saves valuable time",
      "For double/triple passages: find connection points between the passages",
      "For 'What is suggested/implied?' questions: look for paraphrasing, not exact words",
      "Time allocation: ~1 minute per question for Part 7, starting with single passages",
    ],
    icon: <Book className="h-5 w-5" />,
    color: "var(--info)",
  },
];

const DRILLS: DrillOption[] = [
  {
    part: "Part 5",
    label: "Quick Drill · Part 5",
    description: "30 Incomplete Sentences questions",
    questionCount: 10,
    estimatedMinutes: 5,
    href: "/toeic/practice",
  },
  {
    part: "Part 6",
    label: "Quick Drill · Part 6",
    description: "4 Text Completion passages",
    questionCount: 16,
    estimatedMinutes: 8,
    href: "/toeic/practice",
  },
  {
    part: "Part 7",
    label: "Quick Drill · Part 7",
    description: "Single + Double passages",
    questionCount: 15,
    estimatedMinutes: 15,
    href: "/toeic/practice",
  },
  {
    part: "Full",
    label: "Full Reading Test",
    description: "Part 5 + 6 + 7 (75 minutes)",
    questionCount: 100,
    estimatedMinutes: 75,
    href: "/toeic/practice",
  },
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
          {
            key: "overview" as ReadingMode,
            label: "Overview",
            icon: <Book className="h-4 w-4" />,
          },
          {
            key: "strategy" as ReadingMode,
            label: "Strategy",
            icon: <Lightbulb className="h-4 w-4" />,
          },
          { key: "drill" as ReadingMode, label: "Practice", icon: <Rocket className="h-4 w-4" /> },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-100 active:scale-97 ${
              mode === m.key
                ? "border-accent bg-accent/10 text-accent font-bold"
                : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-ink hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm transition-all"
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
          <div className="rounded-2xl border-2 border-border bg-surface-alt p-5 relative overflow-hidden shadow text-text-primary">
            <h3 className="m-0 mb-2 text-lg font-extrabold font-display text-ink">
              TOEIC Reading Section
            </h3>
            <p className="m-0 mb-3.5 text-xs text-text-secondary font-bold leading-relaxed">
              75 minutes · 100 questions · 3 parts (Part 5, 6, 7) · Max 495 points
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {[
                { part: "Part 5", q: "30 Qs", desc: "Incomplete Sentences" },
                { part: "Part 6", q: "16 Qs", desc: "Text Completion" },
                { part: "Part 7", q: "54 Qs", desc: "Reading Comprehension" },
              ].map((p) => (
                <div
                  key={p.part}
                  className="flex-1 min-w-[100px] p-2.5 rounded-xl bg-surface border-2 border-border shadow-sm"
                >
                  <div className="text-xs font-black text-ink">{p.part}</div>
                  <div className="text-[10px] text-text-muted font-bold mt-0.5">
                    {p.q} · {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("strategy")}
              className="rounded-2xl border-2 border-border bg-accent/5 p-5 text-left transition-all hover:scale-[1.01] hover:border-accent hover:bg-accent/10 duration-150 cursor-pointer shadow-xs"
            >
              <Lightbulb className="h-6 w-6 text-accent mb-2" />
              <div className="text-sm font-bold text-ink">Exam Strategies</div>
              <div className="text-[11px] text-text-muted font-bold mt-1">Tips for each Part</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("drill")}
              className="rounded-2xl border-2 border-border bg-secondary/5 p-5 text-left transition-all hover:scale-[1.01] hover:border-secondary hover:bg-secondary/10 duration-150 cursor-pointer shadow-xs"
            >
              <Rocket className="h-6 w-6 text-secondary mb-2" />
              <div className="text-sm font-bold text-ink">Quick Drill</div>
              <div className="text-[11px] text-text-muted font-bold mt-1">
                Practice individual parts
              </div>
            </button>
          </div>

          {/* Full practice CTA */}
          <Link href="/toeic/practice" className="no-underline block group">
            <div className="rounded-2xl border-2 border-border bg-linear-to-br from-accent/5 to-secondary/5 p-5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all duration-200 group-hover:border-accent/40">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-accent/10 text-accent text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-ink">Official ETS Practice</div>
                <div className="text-xs text-text-muted font-bold mt-0.5">
                  1,320 questions from ETS 2020-2021
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      )}

      {/* ── Strategy Mode ── */}
      {mode === "strategy" && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent mb-1 flex items-center gap-2">
            <div className="w-1 h-3.5 rounded bg-accent" />
            <span>Section Strategies</span>
          </div>

          {STRATEGIES.map((s) => {
            const isExpanded = expandedStrategy === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setExpandedStrategy(isExpanded ? null : s.id)}
                className="rounded-2xl border-2 border-border bg-surface p-5 relative overflow-hidden transition-all duration-150 shadow-xs cursor-pointer text-left w-full block active:scale-99"
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
                    <div className="text-sm font-bold text-ink">
                      {s.part} — {s.title}
                    </div>
                    <div className="text-xs text-text-muted font-bold mt-0.5 truncate">
                      {s.description}
                    </div>
                  </div>
                  <ArrowRight
                    className={`h-4.5 w-4.5 text-text-muted transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : "rotate-0"
                    }`}
                  />
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-2 pl-[42px] animate-in fade-in slide-in-from-top-1 duration-150">
                    {s.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-start p-2.5 rounded-xl bg-surface-alt border-2 border-border text-xs text-text-secondary leading-relaxed shadow-sm"
                      >
                        <Star
                          className="h-3 w-3 text-current shrink-0 fill-current mt-0.5"
                          style={{ color: s.color }}
                        />
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
            <div className="w-1 h-3.5 rounded bg-accent" />
            <span>Select Practice</span>
          </div>

          {DRILLS.map((d) => (
            <Link key={d.label} href={d.href} className="no-underline block group">
              <div className="rounded-2xl border-2 border-border bg-surface p-4.5 flex items-center gap-3.5 cursor-pointer shadow-xs transition-all duration-150 group-hover:border-accent/40">
                <div
                  className={`w-10.5 h-10.5 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    d.part === "Full"
                      ? "bg-linear-to-br from-accent to-secondary text-white"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {d.part === "Full" ? (
                    <Trophy className="h-4.5 w-4.5" />
                  ) : (
                    <Rocket className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink">{d.label}</div>
                  <div className="text-xs text-text-muted font-bold mt-0.5 truncate">
                    {d.description}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-accent">{d.questionCount} Qs</div>
                  <div className="text-[10px] text-text-muted font-bold flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{d.estimatedMinutes}m</span>
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
