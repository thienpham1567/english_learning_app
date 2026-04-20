"use client";

import { useState } from "react";
import { LoadingOutlined, TeamOutlined } from "@ant-design/icons";
import { CEFR_LEVELS } from "@/lib/listening/types";
import type { CefrLevel } from "@/lib/listening/types";

type Props = {
  onStart: (args: { topic: string; level: CefrLevel; turns: 6 | 8 | 10; speakers: 2 | 3 }) => void;
  isLoading: boolean;
};

/**
 * Compact form to request a multi-speaker dialogue exercise (Story 19.3.1).
 * Lives alongside the classic LevelSelector — dialogue is additive.
 */
export function DialogueGenerator({ onStart, isLoading }: Props) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<CefrLevel>("B1");
  const [turns, setTurns] = useState<6 | 8 | 10>(8);
  const [speakers, setSpeakers] = useState<2 | 3>(2);

  const canSubmit = topic.trim().length >= 3 && !isLoading;

  return (
    <div
      style={{
        marginTop: 24,
        maxWidth: 600,
        margin: "24px auto 0",
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <TeamOutlined style={{ color: "var(--accent)" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
          Multi-speaker dialogue
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
        Luyện nghe hội thoại 2–3 giọng với các giọng Mỹ, Anh, Úc.
      </div>

      <input
        type="text"
        placeholder="Chủ đề (ví dụ: ordering coffee, job interview)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text)",
          fontSize: 13,
          marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Level{" "}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as CefrLevel)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}
          >
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Turns{" "}
          <select
            value={turns}
            onChange={(e) => setTurns(Number(e.target.value) as 6 | 8 | 10)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}
          >
            <option value={6}>6</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Speakers{" "}
          <select
            value={speakers}
            onChange={(e) => setSpeakers(Number(e.target.value) as 2 | 3)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
      </div>

      <button
        onClick={() => canSubmit && onStart({ topic: topic.trim(), level, turns, speakers })}
        disabled={!canSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: canSubmit ? "var(--accent)" : "var(--border)",
          color: canSubmit ? "#fff" : "var(--text-muted)",
          fontSize: 13,
          fontWeight: 700,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {isLoading ? <LoadingOutlined spin /> : <TeamOutlined />}
        {isLoading ? "Generating dialogue..." : "Generate dialogue"}
      </button>
    </div>
  );
}
