"use client";

import { BookOpen, Loader2, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { NearbyWordsBar } from "@/app/(app)/dictionary/_components/NearbyWordsBar";
import { SensePanel } from "@/app/(app)/dictionary/_components/SensePanel";
import { VerbFormsSection } from "@/app/(app)/dictionary/_components/VerbFormsSection";
import { WordFamilySection } from "@/app/(app)/dictionary/_components/WordFamilySection";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { FrequencyBand, VocabularyWithNearby } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: VocabularyWithNearby | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onOpenThesaurus?: () => void;
  onSearch?: (word: string) => void;
};

const FREQUENCY_CONFIG: Record<
  FrequencyBand,
  { filled: number; label: string; tooltipEn: string }
> = {
  top1k: { filled: 5, label: "Very Common", tooltipEn: "Top 1,000 most common words" },
  top3k: { filled: 4, label: "Common", tooltipEn: "Top 3,000 most common words" },
  top5k: { filled: 3, label: "Fairly Common", tooltipEn: "Top 5,000 most common words" },
  top10k: { filled: 2, label: "Uncommon", tooltipEn: "Top 10,000 most common words" },
  rare: { filled: 1, label: "Rare", tooltipEn: "Uncommon word" },
};

function FrequencyBar({ band }: { band: FrequencyBand }) {
  const { filled, label, tooltipEn } = FREQUENCY_CONFIG[band];
  return (
    <div className="anim-fade-in inline-flex items-center gap-2 relative group">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            data-frequency-segment={i < filled ? "filled" : "empty"}
            className={`w-5 h-1.5 rounded-full ${i < filled ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">{label}</span>
      <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap z-50 shadow-lg">
        {tooltipEn}
      </span>
    </div>
  );
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: "bg-success-bg", text: "text-success", border: "border-success" },
  A2: { bg: "bg-success-bg", text: "text-success", border: "border-success" },
  B1: { bg: "bg-warning-bg", text: "text-warning", border: "border-warning" },
  B2: { bg: "bg-warning-bg", text: "text-warning", border: "border-warning" },
  C1: { bg: "bg-error-bg", text: "text-error", border: "border-error" },
  C2: { bg: "bg-error-bg", text: "text-error", border: "border-error" },
};

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
  slang: { en: "slang", tooltipEn: "Very informal language specific to a group or community." },
  technical: { en: "technical", tooltipEn: "Terms specific to a particular field or industry." },
  literary: { en: "literary", tooltipEn: "Often found in literary works." },
  archaic: { en: "archaic", tooltipEn: "No longer in common use today." },
  colloquial: { en: "colloquial", tooltipEn: "Conversational, relaxed style." },
  vulgar: { en: "vulgar", tooltipEn: "Taboo word, should be avoided." },
  offensive: { en: "offensive", tooltipEn: "May cause offense or hurt the listener." },
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
      className="grid w-6 h-6 place-items-center rounded border-none bg-transparent text-text-muted cursor-pointer transition-colors duration-200 hover:text-accent"
    >
      {speakingLocale === locale ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function getNumberLabel(numberInfo: NonNullable<VocabularyWithNearby["numberInfo"]>): string {
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
  onOpenThesaurus,
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
      <div className="dictionary-result-card rounded-xl bg-surface shadow-lg min-h-[400px]">
        <div className="flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-4 rounded-lg bg-bg-deep animate-pulse ${
                i === 1 ? "w-3/5" : i === 2 ? "w-2/5" : i === 3 ? "w-1/3" : "w-1/4"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="dictionary-result-card rounded-xl bg-surface shadow-lg min-h-[400px]">
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">
            {!hasSearched ? "Enter a word to search" : "No results to display"}
          </p>
        </div>
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;
  const numberLabel = vocabulary.numberInfo ? getNumberLabel(vocabulary.numberInfo) : "";

  return (
    <div
      key={vocabulary.headword}
      className="anim-fade-up dictionary-result-card rounded-xl bg-surface shadow-lg min-h-[400px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent m-0">
            Search Result
          </p>
          <div className="flex items-baseline gap-3 flex-wrap mt-2">
            <h2 className="dictionary-result-heading italic leading-tight font-display text-ink break-words m-0">
              {vocabulary.headword}
            </h2>
            {(() => {
              const posKey =
                vocabulary.entryType === "idiom"
                  ? "idiom"
                  : vocabulary.entryType === "phrasal_verb"
                    ? "phrasal verb"
                    : (vocabulary.partOfSpeech ?? null);
              const posEn = posKey ? POS_LABELS[posKey] : null;
              const display = posEn ?? posKey ?? "word";
              const tooltip = posKey && posEn ? posKey : null;
              return (
                <span className="relative group rounded-full px-3.5 py-1 text-[13px] font-extrabold italic bg-accent-light text-ink border-2 border-border whitespace-nowrap leading-snug">
                  {display}
                  {tooltip && (
                    <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap z-50 shadow-lg not-italic">
                      {tooltip}
                    </span>
                  )}
                </span>
              );
            })()}
            {numberLabel && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-text-muted border-2 border-border whitespace-nowrap">
                {numberLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vocabulary.level &&
            (() => {
              const style = LEVEL_STYLES[vocabulary.level];
              return (
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold tracking-wide border ${style?.bg ?? "bg-bg-deep"} ${style?.text ?? "text-text-secondary"} ${style?.border ?? "border-border"}`}
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
                <span className="relative group rounded-full px-3 py-0.5 text-xs border border-border text-text-primary bg-accent-light font-bold cursor-help">
                  {display}
                  <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap z-50 shadow-lg">
                    {tooltip}
                  </span>
                </span>
              );
            })()}
          {onOpenThesaurus && (
            <button
              type="button"
              onClick={onOpenThesaurus}
              aria-label="Thesaurus"
              className="flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-xs font-bold text-ink border-2 border-border cursor-pointer transition-colors duration-200 hover:bg-accent/15 shadow-sm"
            >
              <BookOpen className="h-3 w-3 text-accent" />
              Thesaurus
            </button>
          )}
          {saved != null && onToggleSaved && (
            <button
              onClick={onToggleSaved}
              className="grid w-8 h-8 place-items-center rounded-full bg-transparent border-none text-text-muted cursor-pointer transition-colors duration-200 hover:text-accent hover:bg-surface-alt"
              aria-label={saved ? "Remove word from saved" : "Save this word"}
            >
              <Star className={`h-5 w-5 ${saved ? "fill-accent text-accent" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Pronunciation */}
      {hasDualPhonetics ? (
        <div className="anim-fade-in mt-3 flex flex-wrap items-center gap-3">
          {vocabulary.phoneticsUs && (
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-surface-alt text-[10px] text-text-secondary font-black border-2 border-border shadow-sm">US</span>
              <span className="rounded bg-bg-deep px-2.5 py-0.5 text-sm font-mono text-ink font-bold border border-border/10">
                {vocabulary.phoneticsUs}
              </span>
              <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
          {vocabulary.phoneticsUs && vocabulary.phoneticsUk && (
            <span className="text-text-muted font-bold">·</span>
          )}
          {vocabulary.phoneticsUk && (
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-surface-alt text-[10px] text-text-secondary font-black border-2 border-border shadow-sm">UK</span>
              <span className="rounded bg-bg-deep px-2.5 py-0.5 text-sm font-mono text-ink font-bold border border-border/10">
                {vocabulary.phoneticsUk}
              </span>
              <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
        </div>
      ) : vocabulary.phonetic ? (
        <span className="anim-fade-in mt-3 inline-block rounded bg-bg-deep px-2 py-0.5 text-sm font-mono text-accent">
          {vocabulary.phonetic}
        </span>
      ) : null}

      {/* ── Meta info strip: Word Family ── */}
      {vocabulary.wordFamily && vocabulary.wordFamily.length > 0 && onSearch && (
        <div className="anim-fade-up mt-5 flex flex-wrap items-start gap-5 bg-bg-deep border-2 border-border border-l-[3px] border-l-accent rounded-sm p-3.5 px-4.5">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <WordFamilySection wordFamily={vocabulary.wordFamily} onSearch={onSearch} />
          </div>
        </div>
      )}

      {vocabulary.verbForms && vocabulary.verbForms.length > 0 && (
        <VerbFormsSection verbForms={vocabulary.verbForms} />
      )}

      {/* Sense tabs */}
      <div className="mt-6">
        <div className="flex items-center gap-2 border-b-2 border-border pb-3 mb-5 overflow-x-auto">
          {vocabulary.senses.map((sense) => (
            <button
              key={sense.id}
              type="button"
              aria-selected={activeKey === sense.id}
              onClick={() => setActiveKey(sense.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold border-2 transition-all duration-200 ${
                activeKey === sense.id
                  ? "bg-accent border-border text-ink shadow-sm cursor-default"
                  : "bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-alt cursor-pointer"
              }`}
            >
              {sense.label}
            </button>
          ))}
        </div>
        {activeSense && (
          <SensePanel
            key={activeSense.id}
            sense={activeSense}
            headword={vocabulary.headword}
            onSearch={onSearch}
          />
        )}
      </div>

      {/* Nearby words bar */}
      {vocabulary.nearbyWords.length > 0 && onSearch && (
        <div className="mt-6 border-t-2 border-border pt-5">
          <NearbyWordsBar
            words={vocabulary.nearbyWords}
            headword={vocabulary.headword}
            onSearch={onSearch}
          />
        </div>
      )}
    </div>
  );
}
