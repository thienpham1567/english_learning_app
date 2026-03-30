"use client";

import { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import { Bookmark, BookmarkCheck, BookOpen, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, VocabularyWithNearby } from "@/lib/schemas/vocabulary";
import { parseBold } from "@/lib/utils/parse-bold";
import { NearbyWordsBar } from "@/components/dictionary/NearbyWordsBar";

type DictionaryResultCardProps = {
  vocabulary: VocabularyWithNearby | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onOpenThesaurus?: () => void;
  onSearch?: (word: string) => void;
};

const SENSE_ITEM_CLASS =
  "border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]";

const ENTRY_TYPE_LABELS: Record<VocabularyWithNearby["entryType"], string> = {
  word: "Từ / cụm từ",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

// Module-level: ensures only one utterance plays at a time across re-renders
let activeUtterance: SpeechSynthesisUtterance | null = null;

function getNumberLabel(numberInfo: NonNullable<VocabularyWithNearby["numberInfo"]>): string {
  if (numberInfo.isUncountable) return "uncountable";
  if (numberInfo.isPluralOnly) return "plural only";
  if (numberInfo.isSingularOnly) return "singular only";
  if (numberInfo.plural) return `pl: ${numberInfo.plural}`;
  return "";
}

function BoldText({ text }: { text: string }) {
  const segments = parseBold(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold not-italic">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function SensePanel({ sense }: { sense: DictionarySense }) {
  const [isCollocationsOpen, setIsCollocationsOpen] = useState(false);
  const examples = sense.examples ?? [];
  const examplesVi = sense.examplesVi ?? [];
  const collocations = sense.collocations ?? [];

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      {(examples.length > 0 || examplesVi.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ví dụ
          </h3>
          <ul className="space-y-2">
            {examples.length > 0
              ? examples.map((example, i) => (
                  <li key={`${example.en}-${example.vi ?? i}`} className={SENSE_ITEM_CLASS}>
                    {example.vi ? (
                      <Tooltip placement="top" title={example.vi}>
                        <span className="cursor-help">
                          <BoldText text={example.en} />
                        </span>
                      </Tooltip>
                    ) : (
                      <BoldText text={example.en} />
                    )}
                  </li>
                ))
              : examplesVi.map((example) => (
                  <li key={example} className={SENSE_ITEM_CLASS}>
                    <BoldText text={example} />
                  </li>
                ))}
          </ul>
        </section>
      )}

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.patterns.map((pattern) => (
              <li key={pattern} className={SENSE_ITEM_CLASS}>
                {pattern}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className="space-y-2">
            {sense.relatedExpressions.map((expr) => (
              <li key={expr} className={SENSE_ITEM_CLASS}>
                {expr}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake} className={SENSE_ITEM_CLASS}>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      {collocations.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            aria-expanded={isCollocationsOpen}
            onClick={() => setIsCollocationsOpen((open) => !open)}
            className="inline-flex items-center rounded-full border border-[rgba(196,109,46,0.18)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-white"
          >
            Collocations ({collocations.length})
          </button>
          <AnimatePresence initial={false}>
            {isCollocationsOpen && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ul className="space-y-1.5">
                  {collocations.map((collocation) => (
                    <li
                      key={`${collocation.en}-${collocation.vi}`}
                      className="text-sm leading-6"
                    >
                      <span className="text-[var(--text-primary)]">
                        <BoldText text={collocation.en} />
                      </span>
                      <span className="mx-1.5 text-[var(--text-muted)]">&mdash;</span>
                      <span className="text-[var(--text-secondary)]">{collocation.vi}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </motion.div>
  );
}

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
      className="grid size-6 place-items-center rounded text-[var(--text-muted)] transition hover:text-[var(--accent)]"
    >
      {speakingLocale === locale ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Volume2 size={13} />
      )}
    </button>
  );
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
  const [speakingLocale, setSpeakingLocale] = useState<string | null>(null);
  const [verbFormsOpen, setVerbFormsOpen] = useState(false);

  useEffect(() => {
    setActiveKey(firstSenseId);
  }, [firstSenseId]);

  useEffect(() => {
    setVerbFormsOpen(false);
  }, [firstSenseId]);

  function speak(locale: "en-US" | "en-GB") {
    if (!vocabulary) return;
    if (activeUtterance) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    }
    const utterance = new SpeechSynthesisUtterance(vocabulary.headword);
    utterance.lang = locale;
    utterance.onstart = () => setSpeakingLocale(locale);
    utterance.onend = () => { setSpeakingLocale(null); activeUtterance = null; };
    utterance.onerror = () => { setSpeakingLocale(null); activeUtterance = null; };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        <div className="animate-pulse space-y-5">
          <div>
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-deep)]" />
            <div className="mt-3 h-8 w-44 rounded-lg bg-[var(--bg-deep)]" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-[var(--bg-deep)]" />
              <div className="h-6 w-9 rounded-full bg-[var(--bg-deep)]" />
            </div>
          </div>
          <div className="h-3.5 w-28 rounded bg-[var(--bg-deep)]" />
          <div className="space-y-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-3/5 rounded bg-[var(--border-strong)]" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-16 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-2/3 rounded bg-[var(--border-strong)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        {!hasSearched ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <BookOpen size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Nhập từ cần tra</p>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
              Chưa có kết quả để hiển thị
            </h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc.
            </p>
          </div>
        )}
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;
  const numberLabel = vocabulary.numberInfo ? getNumberLabel(vocabulary.numberInfo) : "";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-4xl italic leading-tight [font-family:var(--font-display)] text-(--ink)">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="gold" variant="outlined">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag
                  color={LEVEL_COLORS[vocabulary.level] ?? "default"}
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1"
                >
                  {vocabulary.level}
                </Tag>
              )}
              {vocabulary.partOfSpeech && (
                <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
                  {vocabulary.partOfSpeech}
                </Tag>
              )}
              {vocabulary.register && (
                <Tag
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1 !border-amber-300 !text-amber-700 !bg-amber-50"
                >
                  {vocabulary.register}
                </Tag>
              )}
              {numberLabel && (
                <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
                  {numberLabel}
                </Tag>
              )}
              {saved != null && onToggleSaved && (
                <button
                  onClick={onToggleSaved}
                  className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                  aria-label={saved ? "Bỏ lưu từ này" : "Lưu từ này"}
                >
                  {saved ? (
                    <BookmarkCheck size={18} className="text-[var(--accent)]" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Pronunciation — single row */}
          {hasDualPhonetics ? (
            <motion.div
              className="mt-3 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phoneticsUs && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇺🇸</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUs}
                  </span>
                  <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
              {vocabulary.phoneticsUs && vocabulary.phoneticsUk && (
                <span className="text-[var(--text-muted)]">·</span>
              )}
              {vocabulary.phoneticsUk && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUk}
                  </span>
                  <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
            </motion.div>
          ) : vocabulary.phonetic ? (
            <motion.span
              className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.span>
          ) : null}

          {/* Verb forms strip */}
          {vocabulary.verbForms && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setVerbFormsOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
              >
                Verb forms {verbFormsOpen ? "▴" : "▾"}
              </button>
              <AnimatePresence initial={false}>
                {verbFormsOpen && (
                  <motion.p
                    className="mt-1.5 text-sm [font-family:var(--font-mono)] text-[var(--text-secondary)]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {vocabulary.verbForms.base} · {vocabulary.verbForms.thirdPerson} ·{" "}
                    {vocabulary.verbForms.pastSimple} · {vocabulary.verbForms.pastParticiple} ·{" "}
                    {vocabulary.verbForms.presentParticiple}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Overview */}
          <motion.div
            className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--accent-light)] text-[var(--accent)]">VI</span>
              <p>{vocabulary.overviewVi}</p>
            </div>
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--bg)] text-[var(--text-muted)]">EN</span>
              <p>{vocabulary.overviewEn}</p>
            </div>
          </motion.div>

          {/* Sense tabs + Thesaurus button */}
          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
              <div className="flex gap-2 flex-1 overflow-x-auto">
                {vocabulary.senses.map((sense) => (
                  <button
                    key={sense.id}
                    type="button"
                    aria-selected={activeKey === sense.id}
                    onClick={() => setActiveKey(sense.id)}
                    className={[
                      "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                      activeKey === sense.id
                        ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {sense.label}
                  </button>
                ))}
              </div>
              {onOpenThesaurus && (
                <button
                  type="button"
                  onClick={onOpenThesaurus}
                  aria-label="Thesaurus"
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <BookOpen size={12} />
                  Thesaurus
                </button>
              )}
            </div>
            {activeSense && (
              <SensePanel key={activeSense.id} sense={activeSense} />
            )}
          </div>

          {/* Nearby words bar */}
          {vocabulary.nearbyWords.length > 0 && onSearch && (
            <div className="mt-6 border-t border-(--border) pt-5">
              <NearbyWordsBar
                words={vocabulary.nearbyWords}
                headword={vocabulary.headword}
                onSearch={onSearch}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
