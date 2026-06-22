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
      className="bg-surface border border-border rounded-2xl flex flex-col relative p-5 gap-4 shadow-sm"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted flex items-center gap-1.5">
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
          className="w-full h-[320px] text-base leading-[1.75] outline-none p-4 border border-border rounded-xl bg-surface-alt text-ink focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Text Stats */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex gap-4">
          <Stat label="Words" value={wordCount.toLocaleString()} />
          <Stat
            label="Chars"
            value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`}
          />
        </div>
        {wordCount > 0 && (
          <div className="flex items-center gap-1.5 bg-accent/5 border border-accent/15 py-1 px-2.5 rounded-full">
            <Timer size={12} className="text-accent" />
            <span className="text-[11px] text-text-secondary font-medium tabular-nums">
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
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 py-1.5 px-3 font-semibold cursor-pointer text-[11.5px] rounded-lg border border-border transition-all duration-200 shadow-sm hover:shadow ${
        active
          ? "bg-accent text-text-on-accent"
          : danger
            ? "bg-surface text-error hover:bg-error/5"
            : "bg-surface text-text-secondary hover:text-ink hover:bg-surface-hover"
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
      <span className="font-semibold text-text-secondary text-[12px]">{value}</span>
    </div>
  );
}
