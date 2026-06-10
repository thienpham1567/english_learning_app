"use client";

import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Rocket,
  Star,
  Trophy,
} from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";

/* ── Practice cards data ── */
const PRACTICE_CARDS: {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}[] = [
  {
    title: "Part 5 · Grammar Quiz",
    subtitle: "Incomplete Sentences",
    description: "AI-generated grammar questions targeting TOEIC Part 5 patterns",
    href: "/toeic/skills?tab=part5",
    icon: <HelpCircle className="h-5 w-5" />,
    color: "var(--accent)",
    badge: "AI Practice",
  },
  {
    title: "ETS Official Practice",
    subtitle: "Part 5 · 6 · 7",
    description: "1,320 real ETS questions from 2020–2021 official tests",
    href: "/toeic/practice",
    icon: <Trophy className="h-5 w-5" />,
    color: "var(--secondary)",
    badge: "Official",
  },
  {
    title: "Graded Reading",
    subtitle: "CEFR-leveled passages",
    description: "Read passages matched to your level with vocabulary tracking",
    href: "/reading/graded",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "var(--info)",
  },
  {
    title: "News Articles",
    subtitle: "The Guardian",
    description: "Read real-world news articles filtered by topic and difficulty",
    href: "/reading",
    icon: <BookOpenText className="h-5 w-5" />,
    color: "var(--tertiary, #8B5CF6)",
  },
];

/* ── Strategy tips data ── */
const STRATEGIES = [
  {
    part: "Part 5",
    title: "Incomplete Sentences",
    color: "var(--accent)",
    tips: [
      "Read the whole sentence before choosing — don't just look at the blank",
      "Determine the part of speech needed (noun/verb/adj/adv) using sentence structure",
      "Spend at most 20 seconds per question — save time for Part 7",
    ],
  },
  {
    part: "Part 6",
    title: "Text Completion",
    color: "var(--secondary)",
    tips: [
      "Read the ENTIRE passage first — context is extremely important",
      "Sentence insertion questions: pay attention to linking words and logical flow",
      "Spend about 2 minutes per passage (8 minutes total)",
    ],
  },
  {
    part: "Part 7",
    title: "Reading Comprehension",
    color: "var(--info)",
    tips: [
      "READ THE QUESTIONS FIRST before reading the passage — saves valuable time",
      "For double/triple passages: find connection points between them",
      "Time allocation: ~1 minute per question, starting with single passages",
    ],
  },
];

/* ── Component ── */
export function ReadingTab() {
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* ─── Quick Stats Overview ─── */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card shadowSize="md" className="relative overflow-hidden mb-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-info" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 bg-accent/10 border-2 border-accent/20">
              <BookOpen className="text-accent" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="m-0 text-lg font-black text-ink font-display">
                TOEIC Reading Section
              </h3>
              <p className="m-0 text-xs text-text-secondary font-bold mt-0.5">
                75 minutes · 100 questions · Max 495 points
              </p>
            </div>
          </div>

          {/* Part breakdown */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { part: "Part 5", q: "30 Qs", desc: "Incomplete Sentences" },
              { part: "Part 6", q: "16 Qs", desc: "Text Completion" },
              { part: "Part 7", q: "54 Qs", desc: "Reading Comprehension" },
            ].map((p) => (
              <div
                key={p.part}
                className="flex-1 min-w-[100px] p-2.5 rounded-xl bg-surface-alt border-2 border-border"
              >
                <div className="text-xs font-black text-ink">{p.part}</div>
                <div className="text-[10px] text-text-muted font-bold mt-0.5">
                  {p.q} · {p.desc}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </m.div>

      {/* ─── Practice Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {PRACTICE_CARDS.map((card, i) => (
          <m.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
          >
            <Link href={card.href} className="no-underline block group h-full">
              <Card
                shadowSize="sm"
                interactive
                className="h-full relative overflow-hidden transition-all duration-200 group-hover:shadow-md"
              >
                {/* Left accent bar */}
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-r"
                  style={{ backgroundColor: card.color }}
                />

                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center shrink-0 border-2 transition-transform duration-200 group-hover:scale-105"
                    style={{
                      background: `color-mix(in srgb, ${card.color} 10%, var(--surface))`,
                      borderColor: `color-mix(in srgb, ${card.color} 25%, var(--border))`,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-ink">{card.title}</span>
                      {card.badge && (
                        <span
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-lg border-2 shadow-sm"
                          style={{
                            background: `color-mix(in srgb, ${card.color} 10%, var(--surface))`,
                            borderColor: `color-mix(in srgb, ${card.color} 25%, var(--border))`,
                            color: card.color,
                          }}
                        >
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-text-muted mt-0.5">
                      {card.subtitle}
                    </div>
                    <p className="text-xs text-text-secondary font-medium mt-1.5 leading-relaxed m-0">
                      {card.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    size={16}
                    className="text-text-muted shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </Card>
            </Link>
          </m.div>
        ))}
      </div>

      {/* ─── Collapsible Strategy Tips ─── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card shadowSize="sm" className="p-0 overflow-hidden">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setTipsOpen(!tipsOpen)}
            className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer border-none bg-transparent text-left transition-colors hover:bg-surface-hover"
          >
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-accent/10 border-2 border-accent/20 text-accent shrink-0">
              <Lightbulb size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-ink font-display">Exam Strategy Tips</div>
              <div className="text-[11px] text-text-muted font-bold mt-0.5">
                Part 5 · 6 · 7 strategies from 900+ scorers
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-text-muted transition-transform duration-200 ${
                tipsOpen ? "" : "-rotate-90"
              }`}
            />
          </button>

          {/* Tips content */}
          {tipsOpen && (
            <div className="px-5 pb-5 flex flex-col gap-3 border-t-2 border-dashed border-border/40 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
              {STRATEGIES.map((s) => (
                <div key={s.part}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-black text-ink">
                      {s.part} — {s.title}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-3.5">
                    {s.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-start text-xs text-text-secondary leading-relaxed font-medium"
                      >
                        <Star
                          size={10}
                          className="shrink-0 mt-0.5 fill-current"
                          style={{ color: s.color }}
                        />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </m.div>
    </div>
  );
}
