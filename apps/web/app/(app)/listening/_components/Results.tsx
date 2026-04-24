"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { HighlightedText } from "@/app/(app)/english-chatbot/_components/HighlightedText";
import type { DialogueTurnPayload, ListeningSubmitResponse } from "@/lib/listening/types";
import { DialogueTranscript } from "@/app/(app)/listening/_components/SpeakerLegend";

type Props = {
  result: ListeningSubmitResponse;
  onNewExercise: () => void;
  onWordClick?: (word: string, rect: DOMRect) => void;
  savedWords?: Set<string>;
  dialogueTurns?: DialogueTurnPayload[];
};

export function Results({ result, onNewExercise, onWordClick, savedWords, dialogueTurns }: Props) {
  const percentage = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const isGood = percentage >= 75;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Score Card */}
      <div
        style={{
          background: isGood
            ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
            : "color-mix(in srgb, var(--error) 8%, var(--surface))",
          border: `2px solid ${isGood ? "var(--success)" : "var(--error)"}`,
          borderRadius: "var(--radius-lg)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 800, color: isGood ? "var(--success)" : "var(--error)" }}>
          {percentage}%
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginTop: 4 }}>
          {result.correct}/{result.total} câu đúng
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-surface)",
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <TrophyOutlined /> +{result.xpEarned} XP
        </div>
      </div>

      {/* Detailed Results */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Chi tiết kết quả
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.results.map((r, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: `1px solid ${r.correct ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 25%, transparent)"}`,
                borderRadius: "var(--radius-md)",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {r.correct ? (
                  <CheckCircleFilled style={{ color: "var(--success)", fontSize: 16 }} />
                ) : (
                  <CloseCircleFilled style={{ color: "var(--error)", fontSize: 16 }} />
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {i + 1}. {r.question}
                </span>
              </div>
              {!r.correct && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 24 }}>
                  <span style={{ color: "var(--error)", textDecoration: "line-through" }}>
                    {r.options[r.userAnswer]}
                  </span>
                  {" → "}
                  <span style={{ color: "var(--success)", fontWeight: 600 }}>
                    {r.options[r.correctIndex]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          📄 Nguyên văn
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text)",
            fontStyle: "italic",
          }}
        >
          {dialogueTurns && dialogueTurns.length > 0 ? (
            <DialogueTranscript turns={dialogueTurns} />
          ) : onWordClick ? (
            <HighlightedText text={result.passage} onWordClick={onWordClick} savedWords={savedWords} />
          ) : (
            result.passage
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", fontStyle: "normal" }}>
            💡 Nhấn vào từ để tra từ điển và lưu từ vựng
          </div>
        </div>
      </div>

      {/* New Exercise Button */}
      <button
        onClick={onNewExercise}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 24px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          color: "var(--text-on-accent)",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <ReloadOutlined /> Bài mới
      </button>
    </div>
  );
}
