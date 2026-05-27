"use client";

import { Flex, message, Typography } from "antd";
import { Copy, FileText, History, Timer, Trash2 } from "lucide-react";
import * as m from "motion/react-client";

const { Text } = Typography;

const MAX_CHARS = 10_000;

interface TextInputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  onClear: () => void;
  historyCount: number;
  showHistory: boolean;
  onToggleHistory: () => void;
  speed: number;
}

export function TextInputPanel({
  text,
  onTextChange,
  onClear,
  historyCount,
  showHistory,
  onToggleHistory,
  speed,
}: TextInputPanelProps) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedMinutes = Math.ceil(wordCount / (150 * speed));

  const handlePaste = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      onTextChange(clipboard);
      message.success("Pasted from clipboard!");
    } catch {
      message.error("Failed to access clipboard");
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="read-aloud-panel bg-(--surface) rounded-(--radius-xl) border-2 border-border flex flex-col relative"
      style={{ padding: "var(--space-5)", boxShadow: "var(--shadow-md)", gap: "var(--space-4)" }}
    >
      {/* Header Actions */}
      <Flex align="center" justify="space-between">
        <Text className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <FileText className="text-accent" />
          English Passage Input
        </Text>
        <Flex gap={8} className="read-aloud-text-actions">
          <ToolButton
            icon={<History />}
            label={`History (${historyCount})`}
            onClick={onToggleHistory}
            active={showHistory}
          />
          <ToolButton icon={<Copy />} label="Paste" onClick={handlePaste} />
          <ToolButton icon={<Trash2 />} label="Clear All" onClick={onClear} danger />
        </Flex>
      </Flex>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            "Paste or enter an English passage here to listen...\n\nClick on sample passages below for a quick start."
          }
          maxLength={MAX_CHARS}
          className="read-aloud-textarea w-full h-[320px] text-base font-body"
          style={{
            resize: "vertical",
            padding: "var(--space-4)",
            lineHeight: 1.75,
            outline: "none",
          }}
        />
      </div>

      {/* Text Stats */}
      <Flex
        className="read-aloud-text-stats"
        align="center"
        justify="space-between"
        style={{ padding: "0 4px" }}
      >
        <Flex gap={16}>
          <Stat label="Words" value={wordCount.toLocaleString()} />
          <Stat
            label="Characters"
            value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`}
          />
        </Flex>
        {wordCount > 0 && (
          <Flex
            align="center"
            gap={6}
            className="rounded-xl"
            style={{ background: "var(--accent-light)", padding: "4px 10px" }}
          >
            <Timer className="text-xs text-accent" />
            <Text className="text-xs text-accent font-semibold">
              Estimated duration: ~{estimatedMinutes} min
            </Text>
          </Flex>
        )}
      </Flex>
    </m.div>
  );
}

/* ── Small utility components ── */

function ToolButton({
  icon,
  label,
  onClick,
  danger = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <m.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-1.5 py-1.5 px-3 font-semibold cursor-pointer font-body"
      style={{
        borderRadius: "var(--radius-md)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-light)" : "var(--surface-alt)",
        color: danger ? "var(--error)" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12.5,
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </m.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Flex align="center" gap={4}>
      <Text className="text-text-muted" style={{ fontSize: 12.5 }}>
        {label}:
      </Text>
      <Text className="font-bold text-text-secondary" style={{ fontSize: 12.5 }}>
        {value}
      </Text>
    </Flex>
  );
}
