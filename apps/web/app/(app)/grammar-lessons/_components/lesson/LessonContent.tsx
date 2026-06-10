"use client";

import {
  AlertTriangle,
  BookOpen,
  Calculator,
  ChevronRight,
  CircleCheckBig,
  Clock,
  FileText,
  Languages,
  Lightbulb,
  Loader2,
  MessageSquare,
  Pin,
  Play,
  RefreshCw,
  Target,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { GrammarLessonData } from "@/lib/grammar-lessons/schema";

interface LessonContentProps {
  lesson: GrammarLessonData;
  level: string;
  onRegenerate: () => void;
  onStart: () => void;
}

/** Reusable titled card section used throughout the theory view. */
function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card shadowSize="sm" className="rounded-xl bg-surface">
      <span className="flex items-center gap-1.5 text-[11.5px] font-black text-text-secondary uppercase tracking-wider mb-3.5">
        {icon}
        {title}
      </span>
      {children}
    </Card>
  );
}

/** Renders the highlighted fragment of an example sentence in bold accent. */
function HighlightedExample({ en, highlight }: { en: string; highlight: string }) {
  const clean = en.replace(/<\/?highlight>/gi, "");
  const parts = clean.split(highlight);
  return (
    <>
      {parts.map((part, j) => (
        <span key={j}>
          {part}
          {j < parts.length - 1 && (
            <strong className="text-accent-active border-b-2 border-accent-active">
              {highlight}
            </strong>
          )}
        </span>
      ))}
    </>
  );
}

/** Theory view: concept, formula, usage, examples, and pitfalls before practice. */
export function LessonContent({ lesson, level, onRegenerate, onStart }: LessonContentProps) {
  const { speak, isSpeaking, isLoading: isTtsLoading } = useTextToSpeech();

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
          <div className="w-11 h-11 rounded-xl bg-accent grid place-items-center shrink-0 shadow-sm">
            <BookOpen size={20} className="text-text-on-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="m-0 text-xl font-black text-text-primary font-display leading-tight">
              {lesson.title}
            </h2>
            <p className="mt-1 text-sm text-text-secondary font-medium leading-normal">
              {lesson.titleVi}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0 items-center">
            <span className="text-[11px] font-black text-accent-active rounded-full bg-accent-light border-2 border-accent/20 py-1 px-3">
              {level}
            </span>
            <m.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 border-2 border-border rounded-lg bg-surface text-text-secondary cursor-pointer text-xs py-1.5 px-3 font-bold shadow-sm hover:text-text-primary"
            >
              <RefreshCw size={13} /> Regenerate
            </m.button>
          </div>
        </div>
      </Card>

      {/* Formula */}
      {lesson.formula && (
        <Card
          shadowSize="sm"
          bgType="accent-light"
          className="rounded-xl text-center border-accent/20"
        >
          <span className="flex items-center justify-center gap-1.5 text-[11px] text-accent-active font-black uppercase tracking-widest mb-2.5">
            <Calculator size={13} /> Core Structure
          </span>
          <p className="m-0 font-black text-accent-active font-mono text-[19px] tracking-wide break-words">
            {lesson.formula}
          </p>
        </Card>
      )}

      {/* Explanation */}
      <Section icon={<BookOpen size={14} />} title="Concept">
        <p className="m-0 text-text-primary font-medium text-[14.5px] leading-relaxed">
          {lesson.explanationEn ?? lesson.explanation}
        </p>
        <div className="mt-3.5 py-3 px-4 rounded-lg bg-surface-alt border-l-4 border-accent">
          <span className="text-[11.5px] font-black text-accent-active inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Giải thích
          </span>
          <p className="mt-1.5 m-0 text-text-secondary font-medium text-[13.5px] leading-relaxed">
            {lesson.explanation}
          </p>
        </div>
      </Section>

      {/* Usage notes */}
      {lesson.usageNotes && lesson.usageNotes.length > 0 && (
        <Section icon={<Pin className="h-3.5 w-3.5" />} title="Usage Notes">
          <div className="flex flex-col gap-2.5">
            {lesson.usageNotes.map((note, idx) => (
              <div
                key={idx}
                className="flex gap-3 items-start rounded-lg bg-surface-alt border-2 border-border py-3 px-3.5"
              >
                <div className="w-6 h-6 rounded-lg bg-accent-light text-accent-active grid place-items-center text-xs font-black shrink-0">
                  {idx + 1}
                </div>
                <p className="m-0 text-text-primary font-medium text-[13.5px] leading-relaxed">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* TOEIC tips */}
      {lesson.toeicTips && lesson.toeicTips.length > 0 && (
        <Section icon={<Target className="h-3.5 w-3.5 text-accent" />} title="TOEIC Exam Tips">
          <div className="flex flex-col gap-2">
            {lesson.toeicTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex gap-2.5 items-start rounded-lg bg-surface-alt border-2 border-border py-3 px-3.5"
              >
                <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                <p className="m-0 text-text-primary font-semibold text-[13.5px] leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Time signals */}
      {lesson.timeSignals && lesson.timeSignals.length > 0 && (
        <Section icon={<Clock className="h-3.5 w-3.5" />} title="Time Signals & Keywords">
          <div className="flex flex-wrap gap-2">
            {lesson.timeSignals.map((signal, idx) => (
              <span
                key={idx}
                className="text-[13px] font-bold rounded-lg py-1 px-3 bg-info text-white border-2 border-border"
              >
                {signal}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Confusion pairs */}
      {lesson.confusionPairs && lesson.confusionPairs.length > 0 && (
        <Section
          icon={<Zap className="h-3.5 w-3.5 text-accent" />}
          title="Commonly Confused Structures"
        >
          <div className="flex flex-col gap-3">
            {lesson.confusionPairs.map((pair, idx) => (
              <div key={idx} className="rounded-lg border-2 border-border overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="py-2.5 px-3.5 bg-info/5 border-r border-border">
                    <div className="text-xs font-black text-info mb-1">{pair.structureA}</div>
                    <p className="m-0 text-text-primary font-medium text-[12.5px] leading-normal italic">
                      {pair.exampleA}
                    </p>
                  </div>
                  <div className="py-2.5 px-3.5 bg-accent/5">
                    <div className="text-xs font-black text-accent-active mb-1">
                      {pair.structureB}
                    </div>
                    <p className="m-0 text-text-primary font-medium text-[12.5px] leading-normal italic">
                      {pair.exampleB}
                    </p>
                  </div>
                </div>
                <div className="py-2.5 px-3.5 bg-surface-alt border-t border-border">
                  <p className="m-0 text-[13px] leading-relaxed text-text-secondary font-medium inline-flex items-start gap-1.5">
                    <Lightbulb size={14} className="text-warning shrink-0 mt-0.5" />
                    {pair.difference}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Examples */}
      {lesson.examples && lesson.examples.length > 0 && (
        <Section icon={<MessageSquare size={14} />} title="Examples">
          <div className="flex flex-col gap-2.5">
            {lesson.examples.map((ex, idx) => (
              <div key={idx} className="rounded-lg bg-surface-alt border-2 border-border p-3.5">
                <div className="flex items-start gap-2.5">
                  <p className="flex-1 m-0 font-bold text-text-primary text-[14.5px] leading-normal">
                    <HighlightedExample en={ex.en} highlight={ex.highlight} />
                  </p>
                  <m.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => speak(ex.en)}
                    disabled={isSpeaking || isTtsLoading}
                    aria-label="Play example"
                    className="w-7 h-7 grid place-items-center rounded-lg bg-surface text-accent-active shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isTtsLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Volume2 size={15} />
                    )}
                  </m.button>
                </div>
                <p className="mt-1.5 m-0 text-[13px] text-text-muted font-semibold">{ex.vi}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Common mistakes */}
      {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
        <Section
          icon={<AlertTriangle size={14} className="text-warning" />}
          title="Common Pitfalls"
        >
          <div className="flex flex-col gap-2.5">
            {lesson.commonMistakes.map((mItem, idx) => (
              <div key={idx} className="rounded-lg border-2 border-error/15 bg-error/5 p-3.5">
                <div className="flex items-start gap-1.5 font-bold text-error text-[13.5px]">
                  <XCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="line-through">{mItem.wrong}</span>
                </div>
                <div className="flex items-start gap-1.5 font-bold text-success text-[13.5px] mt-1.5">
                  <CircleCheckBig size={15} className="shrink-0 mt-0.5" />
                  <span>{mItem.correct}</span>
                </div>
                {mItem.noteEn && (
                  <div className="mt-2.5 flex items-start gap-1.5 text-text-primary font-medium text-[12.5px]">
                    <Languages size={14} className="text-accent-active shrink-0 mt-0.5" />
                    <span>{mItem.noteEn}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-start gap-1.5 text-text-muted font-medium text-[12.5px]">
                  <Lightbulb size={14} className="text-warning shrink-0 mt-0.5" />
                  <span>{mItem.note}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Start CTA */}
      <m.button
        type="button"
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onStart}
        className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl py-4 px-6 text-base font-black text-text-on-accent bg-accent border-2 border-border shadow-md hover:bg-accent-hover cursor-pointer font-display"
      >
        <Play className="h-4 w-4 fill-current" /> Start Practice — {lesson.exercises.length}{" "}
        questions
        <ChevronRight size={18} />
      </m.button>
    </div>
  );
}
