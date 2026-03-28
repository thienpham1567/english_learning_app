"use client";

import { Card, Skeleton, Tabs, Tag } from "antd";
import { Bookmark, BookmarkCheck, Search, SpellCheck2 } from "lucide-react";
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

const SENSE_LIST_CLASS_NAME =
  "list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-primary)]";

function SensePanel({ sense }: { sense: DictionarySense }) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Ví dụ
        </h3>
        <ul className={SENSE_LIST_CLASS_NAME}>
          {sense.examplesVi.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.patterns.map((pattern) => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.relatedExpressions.map((expr) => (
              <li key={expr}>{expr}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake}>{mistake}</li>
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
  if (isLoading) {
    return (
      <Card
        className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
        variant="borderless"
      >
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
      </Card>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <Card
        className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
        variant="borderless"
      >
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
            {!hasSearched ? <Search size={24} /> : <SpellCheck2 size={24} />}
          </div>
          <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
            {!hasSearched
              ? "Sẵn sàng cho lần tra cứu đầu tiên"
              : "Chưa có kết quả để hiển thị"}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            {!hasSearched
              ? "Nhập một từ vựng ở khung bên trái để xem nghĩa, cách đọc và ghi chú ngữ pháp."
              : "Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc."}
          </p>
        </div>
      </Card>
    );
  }

  const tabItems = vocabulary.senses.map((sense) => ({
    key: sense.id,
    label: sense.label,
    children: <SensePanel sense={sense} />,
  }));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card
          className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
          variant="borderless"
        >
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-3xl leading-tight [font-family:var(--font-display)] text-[var(--ink)]">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="default">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag color={LEVEL_COLORS[vocabulary.level] ?? "default"} className="!rounded-full !px-3 !py-1">
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
            <motion.p
              className="mt-4 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.p>
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

          <Tabs
            className="mt-6 [&_.ant-tabs-nav]:mb-5 [&_.ant-tabs-tab]:rounded-full [&_.ant-tabs-tab]:px-3.5 [&_.ant-tabs-tab]:py-1.5 [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-sm"
            items={tabItems}
            defaultActiveKey={vocabulary.senses[0]?.id}
          />
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
