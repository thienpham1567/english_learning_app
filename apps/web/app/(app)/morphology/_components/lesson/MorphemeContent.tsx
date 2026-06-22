"use client";

import { BookOpen, ChevronRight, Play, RefreshCw, Sparkles } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";
import type { MorphemeLesson } from "@/lib/morphology/schema";
import { FamilyRow } from "./FamilyRow";

const TYPE_BADGE: Record<string, string> = {
  prefix: "Prefix",
  suffix: "Suffix",
  root: "Root",
};

interface MorphemeContentProps {
  lesson: MorphemeLesson;
  onStart: () => void;
  onRegenerate: () => void;
}

/** Theory view for a morpheme: meaning/origin + word family + Start CTA. */
export function MorphemeContent({ lesson, onStart, onRegenerate }: MorphemeContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <Card
        shadowSize="md"
        accentColor="accent"
        accentPosition="top"
        className="rounded-xl bg-surface"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-accent grid place-items-center shrink-0 shadow-sm">
            <span className="text-text-on-accent font-bold text-lg font-mono">
              {lesson.morpheme}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-xl font-bold text-text-primary font-display">
                {lesson.gloss}
              </h2>
              <span className="text-[10.5px] font-bold text-accent-active rounded-full bg-accent-light border border-accent/20 py-0.5 px-2.5">
                {TYPE_BADGE[lesson.type]}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-text-secondary font-medium">{lesson.origin}</p>
          </div>
          <m.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 border border-border rounded-lg bg-surface text-text-secondary cursor-pointer text-xs py-1.5 px-3 font-bold shadow-sm hover:text-text-primary shrink-0"
          >
            <RefreshCw size={13} /> Regenerate
          </m.button>
        </div>
      </Card>

      {/* Meaning */}
      <Card shadowSize="sm" className="rounded-xl bg-surface">
        <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-text-secondary uppercase tracking-wider mb-3">
          <BookOpen size={14} /> What it means
        </span>
        <p className="m-0 text-text-primary font-medium text-[14.5px] leading-relaxed">
          {lesson.meaningEn}
        </p>
        <div className="mt-3 py-3 px-4 rounded-lg bg-surface-alt border-l-4 border-accent">
          <p className="m-0 text-text-secondary font-medium text-[13.5px] leading-relaxed">
            {lesson.meaningVi}
          </p>
        </div>
        {lesson.posEffect && (
          <p className="mt-3 m-0 text-[13px] text-text-muted font-semibold">
            Forms a <span className="text-accent-active font-bold">{lesson.posEffect}</span>.
          </p>
        )}
      </Card>

      {/* Word family */}
      <Card shadowSize="sm" className="rounded-xl bg-surface">
        <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-text-secondary uppercase tracking-wider mb-3.5">
          <Sparkles size={14} /> Word Family
        </span>
        <div className="flex flex-col gap-2.5">
          {lesson.family.map((fw) => (
            <FamilyRow key={fw.word} fw={fw} />
          ))}
        </div>
      </Card>

      {/* Start CTA */}
      <m.button
        type="button"
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onStart}
        className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl py-4 px-6 text-base font-bold text-text-on-accent bg-accent border border-border shadow-md hover:bg-accent-hover cursor-pointer font-display"
      >
        <Play className="h-4 w-4 fill-current" /> Start Practice — {lesson.exercises.length}{" "}
        exercises
        <ChevronRight size={18} />
      </m.button>
    </div>
  );
}
