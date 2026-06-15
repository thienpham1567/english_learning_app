"use client";

import { Copy, FileText, History, Timer, Trash2 } from "lucide-react";
import * as m from "motion/react-client";
import { toast } from "sonner";

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
      toast.success("Pasted from clipboard!");
    } catch {
      toast.error("Failed to access clipboard");
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="read-aloud-panel bg-surface border-2 border-border flex flex-col relative p-5 gap-4 shadow-[4px_4px_0_var(--shadow-color)]"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted flex items-center gap-1.5">
          <FileText size={13} className="text-accent" />
          Đoạn văn tiếng Anh
        </span>
        <div className="flex gap-2 read-aloud-text-actions">
          <ToolButton
            icon={<History />}
            label={`History (${historyCount})`}
            onClick={onToggleHistory}
            active={showHistory}
          />
          <ToolButton icon={<Copy />} label="Paste" onClick={handlePaste} />
          <ToolButton icon={<Trash2 />} label="Clear All" onClick={onClear} danger />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            "Paste or enter an English passage here to listen...\n\nClick on sample passages below for a quick start."
          }
          maxLength={MAX_CHARS}
          className="read-aloud-textarea w-full h-[320px] text-base font-body leading-[1.75] outline-none p-4 border-2 border-border bg-surface-alt text-ink focus:border-accent transition-colors"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Text Stats */}
      <div className="read-aloud-text-stats flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex gap-4">
          <Stat label="Words" value={wordCount.toLocaleString()} />
          <Stat
            label="Chars"
            value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`}
          />
        </div>
        {wordCount > 0 && (
          <div className="flex items-center gap-1.5 bg-accent-light border-2 border-border py-1 px-2.5 shadow-[2px_2px_0_var(--shadow-color)]">
            <Timer size={12} className="text-accent-active" />
            <span className="font-mono text-[11px] text-text-secondary font-bold uppercase tracking-wide">
              ~{estimatedMinutes} phút
            </span>
          </div>
        )}
      </div>
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
      whileHover={{ x: -1, y: -1 }}
      whileTap={{ x: 0, y: 0 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 py-1.5 px-3 font-bold cursor-pointer font-mono text-[11.5px] uppercase tracking-wide border-2 border-border transition-all duration-150 shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-none ${
        active
          ? "bg-accent text-text-on-accent"
          : danger
            ? "bg-surface text-error"
            : "bg-surface text-text-secondary hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </m.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 font-mono">
      <span className="text-text-muted text-[11px] uppercase tracking-wide">{label}</span>
      <span className="font-bold text-text-secondary text-[12px]">{value}</span>
    </div>
  );
}
