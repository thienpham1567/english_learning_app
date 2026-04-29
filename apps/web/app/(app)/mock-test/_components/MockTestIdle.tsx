"use client";

import {
  ClockCircleOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

type Props = {
  examMode: string;
  modeLabel: string;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  onStart: () => void;
};

export function MockTestIdle({ examMode, questionCount, setQuestionCount, onStart }: Props) {
  return (
    <div
      className="anim-fade-up"
      style={{
        textAlign: "center",
        padding: "40px 32px",
        border: "1px solid var(--border)",
        borderRadius: 24,
        background: "var(--surface)",
        boxShadow: "var(--shadow-md)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--accent), var(--secondary))" }} />
      <div style={{
        width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
        background: "var(--accent-muted)", display: "grid", placeItems: "center",
      }}>
        <FileSearchOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
      </div>
      <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontStyle: "italic" }}>Sẵn sàng thi thử?</h2>
      <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 14 }}>
        {examMode === "toeic"
          ? "Bài thi TOEIC Reading: Part 5 + Part 6"
          : "Bài thi IELTS Academic Reading"}
      </p>

      {/* Question count */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
        {[10, 15, 20].map((n) => (
          <button
            key={n}
            onClick={() => setQuestionCount(n)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: questionCount === n ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: questionCount === n ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
              color: questionCount === n ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: questionCount === n ? 700 : 500,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.15s ease",
            }}
          >
            {n} câu
          </button>
        ))}
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "var(--text-muted)", margin: "0 0 24px",
        padding: "6px 16px", borderRadius: 999, background: "var(--bg-secondary)",
      }}>
        <ClockCircleOutlined style={{ fontSize: 11 }} />
        Thời gian: ~{examMode === "toeic" ? Math.round(questionCount * 40 / 60) : questionCount} phút
      </div>

      <div>
        <button
          onClick={onStart}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 36px", borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            color: "var(--text-on-accent)",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
            transition: "all 0.15s ease",
          }}
        >
          <ThunderboltOutlined /> Bắt đầu thi
        </button>
      </div>
    </div>
  );
}

export function MockTestLoading({ modeLabel }: { modeLabel: string }) {
  return (
    <div className="anim-fade-in" style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 300, gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "var(--accent-muted)", display: "grid", placeItems: "center",
      }}>
        <LoadingOutlined spin style={{ fontSize: 28, color: "var(--accent)" }} />
      </div>
      <p style={{ color: "var(--text-secondary)", marginTop: 0, fontSize: 13 }}>
        Đang tạo đề thi {modeLabel}...
      </p>
    </div>
  );
}
