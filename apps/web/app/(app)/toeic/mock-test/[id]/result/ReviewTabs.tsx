"use client";

import { Card, Tabs, Tag } from "antd";
import { useMemo, useState } from "react";

type ReviewQuestion = {
  id: string;
  part: number;
  number: number;
  questionText: string | null;
  options: string[];
  correctIndex: number;
  explanationVi: string | null;
};

type ReviewAnswer = {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  flagged: boolean;
};

export function ReviewTabs({
  questions,
  answers,
}: {
  questions: ReviewQuestion[];
  answers: ReviewAnswer[];
}) {
  const [activeKey, setActiveKey] = useState("wrong");

  const byId = useMemo(() => new Map(answers.map((a) => [a.questionId, a])), [answers]);

  const wrong = useMemo(
    () => questions.filter((q) => byId.get(q.id)?.isCorrect === false),
    [questions, byId],
  );
  const bookmarked = useMemo(
    () => questions.filter((q) => byId.get(q.id)?.flagged === true),
    [questions, byId],
  );

  const renderList = (list: ReviewQuestion[]) => {
    if (list.length === 0) {
      return (
        <div style={{ padding: 12, color: "var(--text-muted, #94a3b8)" }}>Không có câu nào.</div>
      );
    }
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {list.map((q) => {
          const a = byId.get(q.id);
          const userPick = a?.selectedIndex ?? null;
          return (
            <Card key={q.id} size="small">
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Tag color="blue">Part {q.part}</Tag>
                <Tag>Câu {q.number}</Tag>
                {a?.flagged && <Tag color="gold">Bookmarked</Tag>}
                {a?.isCorrect === false && <Tag color="red">Sai</Tag>}
                {a?.isCorrect === true && <Tag color="green">Đúng</Tag>}
                {a?.isCorrect === null && <Tag>Bỏ qua</Tag>}
              </div>
              {q.questionText && <div style={{ marginBottom: 8 }}>{q.questionText}</div>}
              <div style={{ display: "grid", gap: 4 }}>
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isPick = i === userPick;
                  const bg = isCorrect
                    ? "rgba(16,185,129,0.15)"
                    : isPick
                      ? "rgba(239,68,68,0.15)"
                      : "transparent";
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: bg,
                        fontSize: 14,
                      }}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                      {isCorrect && (
                        <Tag color="green" style={{ marginLeft: 8 }}>
                          Đáp án
                        </Tag>
                      )}
                      {isPick && !isCorrect && (
                        <Tag color="red" style={{ marginLeft: 8 }}>
                          Bạn chọn
                        </Tag>
                      )}
                    </div>
                  );
                })}
              </div>
              {q.explanationVi && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    background: "var(--surface, #0f172a)",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "var(--text-muted, #cbd5e1)",
                  }}
                >
                  <strong>Giải thích:</strong> {q.explanationVi}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card title="Review" size="small">
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={[
          { key: "wrong", label: `Sai (${wrong.length})`, children: renderList(wrong) },
          { key: "all", label: `Tất cả (${questions.length})`, children: renderList(questions) },
          {
            key: "bookmarked",
            label: `Bookmarked (${bookmarked.length})`,
            children: renderList(bookmarked),
          },
        ]}
      />
    </Card>
  );
}
