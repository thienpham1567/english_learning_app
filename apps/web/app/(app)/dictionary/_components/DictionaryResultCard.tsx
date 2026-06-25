"use client";

import { BookOpen, Loader2, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { SensePanel } from "@/app/(app)/dictionary/_components/SensePanel";
import { VerbFormsSection } from "@/app/(app)/dictionary/_components/VerbFormsSection";
import { WordFamilySection } from "@/app/(app)/dictionary/_components/WordFamilySection";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onSearch?: (word: string) => void;
};

import { CEFR_BADGE_CLASSES } from "@/lib/constants/cefr";

// Maps the prompt's allowed partOfSpeech values to learner-friendly labels.
const POS_LABELS: Record<string, string> = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  "phrasal verb": "phrasal verb",
  idiom: "idiom",
  preposition: "preposition",
  conjunction: "conjunction",
  determiner: "determiner",
  pronoun: "pronoun",
  interjection: "interjection",
  "auxiliary verb": "auxiliary verb",
  "modal verb": "modal verb",
  article: "article",
};

// Maps the prompt's allowed register values to English with tooltip context.
const REGISTER_INFO: Record<string, { en: string; tooltipEn: string }> = {
  formal: {
    en: "formal",
    tooltipEn: "Used in academic, legal, or professional writing.",
  },
  informal: { en: "informal", tooltipEn: "Used in everyday communication." },
  slang: {
    en: "slang",
    tooltipEn: "Very informal language specific to a group or community.",
  },
  technical: {
    en: "technical",
    tooltipEn: "Terms specific to a particular field or industry.",
  },
  literary: { en: "literary", tooltipEn: "Often found in literary works." },
  archaic: { en: "archaic", tooltipEn: "No longer in common use today." },
  colloquial: { en: "colloquial", tooltipEn: "Conversational, relaxed style." },
  vulgar: { en: "vulgar", tooltipEn: "Taboo word, should be avoided." },
  offensive: {
    en: "offensive",
    tooltipEn: "May cause offense or hurt the listener.",
  },
};

function AudioButton({
  locale,
  speakingLocale,
  onSpeak,
}: {
  locale: "en-US" | "en-GB";
  speakingLocale: string | null;
  onSpeak: (locale: "en-US" | "en-GB") => void;
}) {
  return (
    <button
      type="button"
      aria-label={locale === "en-US" ? "Play US pronunciation" : "Play UK pronunciation"}
      onClick={() => onSpeak(locale)}
      className="grid w-6 h-6 place-items-center bg-transparent text-text-muted cursor-pointer transition-colors duration-150 hover:text-accent-active active:scale-90"
    >
      {speakingLocale === locale ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function getNumberLabel(numberInfo: NonNullable<Vocabulary["numberInfo"]>): string {
  if (numberInfo.isUncountable) return "uncountable";
  if (numberInfo.isPluralOnly) return "plural only";
  if (numberInfo.isSingularOnly) return "singular only";
  if (numberInfo.plural) return `plural: ${numberInfo.plural}`;
  return "";
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
  onSearch,
}: DictionaryResultCardProps) {
  const firstSenseId = vocabulary?.senses[0]?.id ?? "";
  const [activeKey, setActiveKey] = useState(firstSenseId);
  const { speakingLocale, speak: speakAudio } = useAudioPlayer();

  function speak(locale: "en-US" | "en-GB") {
    if (!vocabulary) return;
    speakAudio(vocabulary.headword, locale);
  }

  if (isLoading) {
    return (
      <div className="dictionary-result-card bg-surface min-h-[400px]">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
          <span className="inline-block h-2 w-2 animate-pulse bg-accent" />
          Đang tra cứu…
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <div className="h-9 w-3/5 rounded-lg border border-border bg-bg-deep animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-md border border-border bg-bg-deep animate-pulse" />
            <div className="h-6 w-14 rounded-md border border-border bg-bg-deep animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 bg-bg-deep animate-pulse ${
                i === 1 ? "w-full" : i === 2 ? "w-5/6" : "w-2/3"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="dictionary-result-card bg-surface min-h-[400px]">
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-bg-deep text-text-muted shadow-md">
            <BookOpen className="h-7 w-7" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {!hasSearched ? "Nhập một từ để tra cứu" : "Không có kết quả"}
          </p>
        </div>
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;
  const numberLabel = vocabulary.numberInfo ? getNumberLabel(vocabulary.numberInfo) : "";

  // Determine POS display
  const posKey =
    vocabulary.entryType === "idiom"
      ? "idiom"
      : vocabulary.entryType === "phrasal_verb"
        ? "phrasal verb"
        : (vocabulary.partOfSpeech ?? null);
  const posEn = posKey ? POS_LABELS[posKey] : null;
  const posDisplay = posEn ?? posKey ?? "word";

  return (
    <div key={vocabulary.headword} className="dictionary-result-card bg-surface min-h-[400px]">
      {/* ── Header: accent spine + headword + metadata ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-stretch gap-3.5">
          {/* Brutalist accent spine */}
          <div className="w-1.5 shrink-0 bg-accent" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              <span className="text-accent">◆</span>
              Từ điển
            </div>
            <h2 className="dictionary-result-heading leading-[0.95] font-display font-bold text-ink break-words m-0 mt-1">
              {vocabulary.headword}
            </h2>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="border border-border bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-on-accent rounded-lg shadow-sm whitespace-nowrap">
                {posDisplay}
              </span>
              {numberLabel && (
                <span className="border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-text-muted rounded-lg whitespace-nowrap">
                  {numberLabel}
                </span>
              )}
              {vocabulary.level &&
                (() => {
                  const badgeClass =
                    CEFR_BADGE_CLASSES[vocabulary.level] ??
                    "text-text-secondary border-border bg-bg-deep";
                  return (
                    <span
                      className={`border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide rounded-lg ${badgeClass}`}
                    >
                      {vocabulary.level}
                    </span>
                  );
                })()}
              {vocabulary.register &&
                (() => {
                  const info = REGISTER_INFO[vocabulary.register];
                  const display = info?.en ?? vocabulary.register;
                  const tooltip = info
                    ? `${vocabulary.register} — ${info.tooltipEn}`
                    : vocabulary.register;
                  return (
                    <span className="relative group border border-border bg-accent-light px-2.5 py-0.5 text-[11px] font-semibold text-text-primary rounded-lg cursor-help">
                      {display}
                      <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-ink text-white text-[10px] font-medium whitespace-nowrap z-50 shadow">
                        {tooltip}
                      </span>
                    </span>
                  );
                })()}
            </div>
          </div>
        </div>
        {/* Save button */}
        {saved != null && onToggleSaved && (
          <button
            onClick={onToggleSaved}
            className={`grid w-9 h-9 shrink-0 place-items-center rounded-xl border border-border cursor-pointer shadow-sm transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow active:translate-x-0 active:translate-y-0 active:shadow-none ${
              saved ? "bg-accent text-text-on-accent" : "bg-surface text-text-muted hover:text-ink"
            }`}
            aria-label={saved ? "Remove word from saved" : "Save this word"}
          >
            <Star className={`h-4.5 w-4.5 ${saved ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      {/* ── Pronunciation ── */}
      {hasDualPhonetics ? (
        <div className="anim-fade-in mt-4 flex flex-wrap items-center gap-2.5">
          {vocabulary.phoneticsUs && (
            <div className="flex items-stretch rounded-xl overflow-hidden border border-border bg-bg-deep pr-1.5 shadow-sm">
              <span className="grid place-items-center bg-ink px-2 text-[10px] font-bold text-bg">
                US
              </span>
              <span className="px-2.5 py-1 text-sm font-mono text-ink font-bold">
                {vocabulary.phoneticsUs}
              </span>
              <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
          {vocabulary.phoneticsUk && (
            <div className="flex items-stretch rounded-xl overflow-hidden border border-border bg-bg-deep pr-1.5 shadow-sm">
              <span className="grid place-items-center bg-ink px-2 text-[10px] font-bold text-bg">
                UK
              </span>
              <span className="px-2.5 py-1 text-sm font-mono text-ink font-bold">
                {vocabulary.phoneticsUk}
              </span>
              <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
        </div>
      ) : vocabulary.phonetic ? (
        <span className="anim-fade-in mt-4 inline-block rounded-lg border border-border bg-bg-deep px-2.5 py-0.5 text-sm font-mono text-accent-active">
          {vocabulary.phonetic}
        </span>
      ) : null}

      {/* ── Word Family ── */}
      {vocabulary.wordFamily && vocabulary.wordFamily.length > 0 && onSearch && (
        <div className="anim-fade-up mt-5">
          <WordFamilySection wordFamily={vocabulary.wordFamily} onSearch={onSearch} />
        </div>
      )}

      {/* ── Verb Forms ── */}
      {vocabulary.verbForms && vocabulary.verbForms.length > 0 && (
        <VerbFormsSection verbForms={vocabulary.verbForms} />
      )}

      {/* ── Sense tabs ── */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Nghĩa · {vocabulary.senses.length}
          </span>
          <span className="h-0.5 flex-1 bg-border" />
        </div>
        <div
          role="tablist"
          aria-label="Word senses"
          className="flex items-center gap-2 pb-4 mb-5 overflow-x-auto"
        >
          {vocabulary.senses.map((sense, i) => (
            <button
              key={sense.id}
              type="button"
              role="tab"
              id={`sense-tab-${sense.id}`}
              aria-controls={`sense-panel-${sense.id}`}
              aria-selected={activeKey === sense.id}
              tabIndex={activeKey === sense.id ? 0 : -1}
              onClick={() => setActiveKey(sense.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold border transition-all duration-150 ${
                activeKey === sense.id
                  ? "bg-accent border-border text-text-on-accent shadow-sm cursor-default"
                  : "bg-surface border-border text-text-secondary hover:-translate-x-px hover:-translate-y-px hover:text-ink hover:shadow-sm cursor-pointer"
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              {sense.label}
            </button>
          ))}
        </div>
        {activeSense && (
          <div
            role="tabpanel"
            id={`sense-panel-${activeSense.id}`}
            aria-labelledby={`sense-tab-${activeSense.id}`}
            tabIndex={0}
          >
            <SensePanel
              key={activeSense.id}
              sense={activeSense}
              headword={vocabulary.headword}
              onSearch={onSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
