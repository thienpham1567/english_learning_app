"use client";

import { useState } from "react";
import { TeamOutlined } from "@ant-design/icons";
import { Select, Input, Button } from "antd";
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
        padding: "20px 24px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg, 16px)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <TeamOutlined style={{ color: "var(--accent)", fontSize: 18 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          Multi-speaker dialogue
        </div>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
        Luyện nghe hội thoại 2–3 giọng với các giọng Mỹ, Anh, Úc.
      </div>

      <Input
        placeholder="Chủ đề (ví dụ: ordering coffee, job interview)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        size="large"
        style={{
          marginBottom: 16,
        }}
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Level</span>
          <Select
            value={level}
            onChange={(val) => setLevel(val as CefrLevel)}
            options={CEFR_LEVELS.map(l => ({ value: l, label: l }))}
            style={{ width: 80 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Turns</span>
          <Select
            value={turns}
            onChange={(val) => setTurns(val as 6 | 8 | 10)}
            options={[
              { value: 6, label: "6" },
              { value: 8, label: "8" },
              { value: 10, label: "10" }
            ]}
            style={{ width: 70 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Speakers</span>
          <Select
            value={speakers}
            onChange={(val) => setSpeakers(val as 2 | 3)}
            options={[
              { value: 2, label: "2" },
              { value: 3, label: "3" }
            ]}
            style={{ width: 70 }}
          />
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={() => canSubmit && onStart({ topic: topic.trim(), level, turns, speakers })}
        disabled={!canSubmit}
        loading={isLoading}
        icon={<TeamOutlined />}
        style={{
          background: canSubmit ? "var(--accent)" : "var(--border)",
          color: canSubmit ? "var(--text-on-accent)" : "var(--text-muted)",
          fontWeight: 600,
          border: "none",
        }}
      >
        Generate dialogue
      </Button>
    </div>
  );
}
