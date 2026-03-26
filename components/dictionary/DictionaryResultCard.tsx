"use client";

import { Card, Descriptions, Skeleton, Tag } from "antd";
import { BookMarked, Search, SpellCheck2 } from "lucide-react";

import type { Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
};

const LEVEL_COLORS: Record<Vocabulary["level"], string> = {
  "Dễ": "green",
  "Trung bình": "gold",
  "Khó": "volcano",
};

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
}: DictionaryResultCardProps) {
  if (isLoading) {
    return (
      <Card className="dictionary-card dictionary-result-card" bordered={false}>
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
      <Card className="dictionary-card dictionary-result-card" bordered={false}>
        <div className="dictionary-empty-state">
          <div className="dictionary-empty-state__icon">
            {!hasSearched ? <Search size={26} /> : <SpellCheck2 size={26} />}
          </div>
          <h3>
            {!hasSearched ? "San sang cho lan tra cuu dau tien" : "Chua co ket qua de hien thi"}
          </h3>
          <p>
            {!hasSearched
              ? "Nhap mot tu vung o khung ben trai de xem nghia, cach doc va ghi chu ngu phap."
              : "Hay thu lai voi mot tu tieng Anh hop le de nhan ket qua co cau truc."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dictionary-card dictionary-result-card" bordered={false}>
      <div className="dictionary-result-card__header">
        <div>
          <p className="dictionary-result-card__eyebrow">Ket qua tu dien</p>
          <h2>{vocabulary.word}</h2>
        </div>
        <Tag color={LEVEL_COLORS[vocabulary.level]} className="dictionary-result-card__tag">
          {vocabulary.level}
        </Tag>
      </div>

      <Descriptions
        column={1}
        size="middle"
        className="dictionary-result-card__descriptions"
        items={[
          {
            key: "phonetic",
            label: "Phien am",
            children: <span className="dictionary-result-card__phonetic">{vocabulary.phonetic}</span>,
          },
          {
            key: "meaning",
            label: "Nghia",
            children: vocabulary.meaning,
          },
          {
            key: "example",
            label: "Vi du",
            children: <em>{vocabulary.example}</em>,
          },
        ]}
      />

      <div className="dictionary-result-card__notes">
        <div className="dictionary-result-card__notes-header">
          <BookMarked size={18} />
          <h3>Grammar notes</h3>
        </div>
        <ul className="dictionary-result-card__notes-list">
          {vocabulary.grammar_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
