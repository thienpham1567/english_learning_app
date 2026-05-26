"use client";

import { useState, useCallback } from "react";
import { Flex, Typography, message } from "antd";

import * as m from "motion/react-client";
import { TOEIC_TOPICS, SAMPLE_TEXTS, type SampleText, type SampleLength } from "../_data/sample-passages";
import { Loader2 } from "lucide-react";

const { Text } = Typography;

interface PassageBrowserProps {
  onSelectPassage: (text: string, title: string) => void;
}

export function PassageBrowser({ onSelectPassage }: PassageBrowserProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedLength, setSelectedLength] = useState<SampleLength | "all">("all");
  const [aiPassages, setAiPassages] = useState<SampleText[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const generateAiPassages = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/read-aloud/passages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic !== "all" ? selectedTopic : undefined,
          length: selectedLength !== "all" ? selectedLength : "medium",
          count: 3,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.passages?.length) {
        setAiPassages((prev) => [...data.passages, ...prev].slice(0, 30));
        message.success(`✨ Đã tạo ${data.passages.length} đoạn văn mới bằng AI!`);
      }
    } catch {
      message.error("Không thể tạo đoạn văn. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  }, [selectedTopic, selectedLength]);

  // Combined passages: AI-generated first, then hardcoded fallbacks
  const allPassages = [...aiPassages, ...SAMPLE_TEXTS];
  const filteredPassages = allPassages.filter((p) => {
    if (selectedTopic !== "all" && p.topic !== selectedTopic) return false;
    if (selectedLength !== "all" && p.length !== selectedLength) return false;
    return true;
  });

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="read-aloud-panel"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header + AI Generate Button */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📚 Văn bản mẫu ({filteredPassages.length})
          </Text>
        </Flex>
        <m.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={generateAiPassages}
          disabled={aiLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 12,
            border: "1px solid var(--accent)",
            background: "var(--accent-light)",
            color: "var(--accent)",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: aiLoading ? "wait" : "pointer",
            opacity: aiLoading ? 0.6 : 1,
            fontFamily: "var(--font-body)",
            transition: "all 0.2s",
          }}
        >
          {aiLoading ? (
            <><Loader2 className="animate-spin" size={12} /> Đang tạo...</>
          ) : (
            <>✨ Tạo bằng AI</>
          )}
        </m.button>
      </Flex>

      {/* Topic filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <FilterChip
          label="Tất cả"
          active={selectedTopic === "all"}
          onClick={() => setSelectedTopic("all")}
        />
        {TOEIC_TOPICS.map((t) => (
          <FilterChip
            key={t.key}
            label={`${t.icon} ${t.label}`}
            active={selectedTopic === t.key}
            onClick={() => setSelectedTopic(t.key)}
          />
        ))}
      </div>

      {/* Length filter */}
      <Flex gap={6} align="center">
        <Text style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Độ dài:</Text>
        {(["all", "short", "medium", "long"] as const).map((len) => (
          <FilterChip
            key={len}
            label={len === "all" ? "Tất cả" : len === "short" ? "Ngắn (~30 từ)" : len === "medium" ? "Trung bình (~60 từ)" : "Dài (~120 từ)"}
            active={selectedLength === len}
            onClick={() => setSelectedLength(len)}
          />
        ))}
      </Flex>

      {/* Passage cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
        {filteredPassages.length === 0 ? (
          <div style={{
            padding: "24px 16px", textAlign: "center",
            borderRadius: 14, border: "1px dashed var(--border)",
            color: "var(--text-muted)", fontSize: 13,
          }}>
            Không có đoạn văn nào. Nhấn &quot;✨ Tạo bằng AI&quot; để tạo mới!
          </div>
        ) : (
          filteredPassages.map((sample, idx) => (
            <m.div
              key={`${sample.topic}-${idx}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              whileHover={{ x: 3, background: "var(--accent-light)" }}
              onClick={() => {
                onSelectPassage(sample.text, sample.title);
                message.success(`Đã tải: ${sample.title}`);
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "var(--surface-alt)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--accent-light)", border: "1px solid var(--border)",
                display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0,
              }}>
                {sample.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)",
                  lineHeight: 1.3,
                }}>
                  {sample.title}
                </div>
                <div style={{
                  fontSize: 12, color: "var(--text-muted)", marginTop: 3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {sample.text.slice(0, 80)}...
                </div>
                <Flex gap={6} style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 8,
                    background: sample.length === "short" ? "rgba(16,185,129,0.1)" : sample.length === "long" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.1)",
                    color: sample.length === "short" ? "var(--success)" : sample.length === "long" ? "var(--error)" : "var(--info)",
                    border: `1px solid ${sample.length === "short" ? "rgba(16,185,129,0.2)" : sample.length === "long" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.2)"}`,
                  }}>
                    {sample.length === "short" ? "Ngắn" : sample.length === "long" ? "Dài" : "TB"}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                  }}>
                    ~{sample.text.split(/\s+/).length} từ
                  </span>
                </Flex>
              </div>
            </m.div>
          ))
        )}
      </div>
    </m.div>
  );
}

/* ── Filter chip ── */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
