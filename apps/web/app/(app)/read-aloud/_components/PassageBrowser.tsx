"use client";

import { Flex, message, Typography } from "antd";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import {
  SAMPLE_TEXTS,
  type SampleLength,
  type SampleText,
  TOEIC_TOPICS,
} from "../_data/sample-passages";

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
        message.success(`Generated ${data.passages.length} new passages with AI!`);
      }
    } catch {
      message.error("Failed to generate passages. Please try again.");
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
      className="read-aloud-panel bg-(--surface) rounded-(--radius-xl) border-2 border-border flex flex-col gap-4"
      style={{ padding: "var(--space-5)", boxShadow: "var(--shadow-md)" }}
    >
      {/* Header + AI Generate Button */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Text className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-accent" />
            Sample Passages ({filteredPassages.length})
          </Text>
        </Flex>
        <m.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={generateAiPassages}
          disabled={aiLoading}
          className="flex items-center gap-1.5 rounded-xl text-accent font-bold font-body"
          style={{
            padding: "7px 16px",
            border: "1px solid var(--accent)",
            background: "var(--accent-light)",
            fontSize: 12.5,
            cursor: aiLoading ? "wait" : "pointer",
            opacity: aiLoading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {aiLoading ? (
            <>
              <Loader2 className="animate-spin" size={12} /> Generating...
            </>
          ) : (
            <>
              <Sparkles size={12} /> Generate with AI
            </>
          )}
        </m.button>
      </Flex>

      {/* Topic filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label="All Topics"
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
        <Text className="text-[11px] text-text-muted font-semibold">Length:</Text>
        {(["all", "short", "medium", "long"] as const).map((len) => (
          <FilterChip
            key={len}
            label={
              len === "all"
                ? "All"
                : len === "short"
                  ? "Short (~30 words)"
                  : len === "medium"
                    ? "Medium (~60 words)"
                    : "Long (~120 words)"
            }
            active={selectedLength === len}
            onClick={() => setSelectedLength(len)}
          />
        ))}
      </Flex>

      {/* Passage cards */}
      <div className="flex flex-col gap-2 h-[400px] overflow-y-auto">
        {filteredPassages.length === 0 ? (
          <div
            className="text-center text-text-muted text-[13px]"
            style={{ padding: "24px 16px", borderRadius: 14, border: "1px dashed var(--border)" }}
          >
            No passages found. Click "Generate with AI" to create new ones!
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
                message.success(`Loaded: ${sample.title}`);
              }}
              className="flex items-start gap-3 rounded-(--radius-lg) border-2 border-border bg-surface-alt cursor-pointer"
              style={{ padding: "12px 14px", transition: "all 0.15s" }}
            >
              <div
                className="w-[36px] h-[36px] border-2 border-border grid text-lg shrink-0"
                style={{
                  borderRadius: 10,
                  background: "var(--accent-light)",
                  placeItems: "center",
                }}
              >
                {sample.icon}
              </div>
              <div className="flex-1 w-[0px]">
                <div
                  className="font-bold text-text-primary"
                  style={{ fontSize: 13.5, lineHeight: 1.3 }}
                >
                  {sample.title}
                </div>
                <div
                  className="text-xs text-text-muted overflow-hidden"
                  style={{ marginTop: 3, textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {sample.text.slice(0, 80)}...
                </div>
                <Flex gap={6} className="mt-1.5">
                  <span
                    className="text-[10px] font-bold rounded-lg"
                    style={{
                      padding: "1px 8px",
                      background:
                        sample.length === "short"
                          ? "rgba(16,185,129,0.1)"
                          : sample.length === "long"
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(59,130,246,0.1)",
                      color:
                        sample.length === "short"
                          ? "var(--success)"
                          : sample.length === "long"
                            ? "var(--error)"
                            : "var(--info)",
                      border: `1px solid ${sample.length === "short" ? "rgba(16,185,129,0.2)" : sample.length === "long" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.2)"}`,
                    }}
                  >
                    {sample.length === "short" ? "Short" : sample.length === "long" ? "Long" : "Medium"}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted">
                    ~{sample.text.split(/\s+/).length} words
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
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full cursor-pointer font-body"
      style={{
        padding: "4px 12px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
