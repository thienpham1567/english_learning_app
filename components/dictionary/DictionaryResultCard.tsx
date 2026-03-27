"use client";

import { Card, Skeleton, Tabs, Tag } from "antd";
import { Search, SpellCheck2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
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
      className="dictionary-sense-panel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section>
        <h3>Nghĩa tiếng Việt</h3>
        <p>{sense.definitionVi}</p>
      </section>

      <section>
        <h3>Definition in English</h3>
        <p>{sense.definitionEn}</p>
      </section>

      <section>
        <h3>Ví dụ</h3>
        <ul>
          {sense.examplesVi.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>

      {sense.usageNoteVi && (
        <section>
          <h3>Ghi chú sử dụng</h3>
          <p>{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section>
          <h3>Mẫu câu thường gặp</h3>
          <ul>
            {sense.patterns.map((pattern) => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section>
          <h3>Biểu đạt liên quan</h3>
          <ul>
            {sense.relatedExpressions.map((expr) => (
              <li key={expr}>{expr}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section>
          <h3>Lỗi thường gặp</h3>
          <ul>
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
}: DictionaryResultCardProps) {
  if (isLoading) {
    return (
      <Card className="dictionary-card dictionary-result-card" variant="borderless">
        <div className="dictionary-result-card__loading">
          <Skeleton active paragraph={{ rows: 1, width: ["45%"] }} title={false} />
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: "28%" }} />
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: "22%" }} />
        </div>
      </Card>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <Card className="dictionary-card dictionary-result-card" variant="borderless">
        <div className="dictionary-empty-state">
          <div className="dictionary-empty-state__icon">
            {!hasSearched ? <Search size={24} /> : <SpellCheck2 size={24} />}
          </div>
          <h3>
            {!hasSearched
              ? "Sẵn sàng cho lần tra cứu đầu tiên"
              : "Chưa có kết quả để hiển thị"}
          </h3>
          <p>
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
        <Card className="dictionary-card dictionary-result-card" variant="borderless">
          <div className="dictionary-result-card__header">
            <div>
              <p className="dictionary-result-card__eyebrow">Kết quả tra cứu</p>
              <h2>{vocabulary.headword}</h2>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag className="dictionary-result-card__entry-type" color="default">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag
                  color={LEVEL_COLORS[vocabulary.level] ?? "default"}
                  className="dictionary-result-card__tag"
                >
                  {vocabulary.level}
                </Tag>
              )}
            </div>
          </div>

          {vocabulary.phonetic && (
            <motion.p
              className="dictionary-result-card__phonetic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.p>
          )}

          <motion.div
            className="dictionary-result-card__overview"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <p>{vocabulary.overviewVi}</p>
            <p>{vocabulary.overviewEn}</p>
          </motion.div>

          <Tabs
            className="dictionary-result-card__tabs"
            items={tabItems}
            defaultActiveKey={vocabulary.senses[0]?.id}
          />
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
