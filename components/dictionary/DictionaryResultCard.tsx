"use client";

import { useEffect, useState } from "react";
import { Tag } from "antd";
import { Bookmark, BookmarkCheck, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
};

const ENTRY_TYPE_LABELS: Record<Vocabulary["entryType"], string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
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

function SensePanel({ sense }: { sense: DictionarySense }) {
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

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Ví dụ
        </h3>
        <ul className="space-y-2">
          {sense.examplesVi.map((example) => (
            <li
              key={example}
              className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
            >
              {example}
            </li>
          ))}
        </ul>
      </section>

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
              <li
                key={pattern}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
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
              <li
                key={expr}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
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
              <li
                key={mistake}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
}: DictionaryResultCardProps) {
  const [activeKey, setActiveKey] = useState(vocabulary?.senses[0]?.id ?? "");

  useEffect(() => {
    if (vocabulary) setActiveKey(vocabulary.senses[0]?.id ?? "");
  }, [vocabulary?.headword]);

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

          {vocabulary.phonetic && (
            <motion.span
              className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.span>
          )}

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

          <div className="mt-6">
            <div className="flex gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
              {vocabulary.senses.map((sense) => (
                <button
                  key={sense.id}
                  type="button"
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
            {activeSense && <SensePanel sense={activeSense} />}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
