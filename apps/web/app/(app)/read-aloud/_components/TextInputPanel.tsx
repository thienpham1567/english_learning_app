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
      className="read-aloud-panel bg-surface rounded-xl border-2 border-border flex flex-col relative p-5 gap-4 shadow-md"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <FileText className="text-accent" />
          English Passage Input
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
          className="read-aloud-textarea w-full h-[320px] text-base font-body leading-[1.75] outline-none p-4"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Text Stats */}
      <div className="read-aloud-text-stats flex items-center justify-between px-1">
        <div className="flex gap-4">
          <Stat label="Words" value={wordCount.toLocaleString()} />
          <Stat
            label="Characters"
            value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`}
          />
        </div>
        {wordCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-accent-light py-1 px-2.5">
            <Timer className="text-xs text-accent" />
            <span className="text-xs text-accent font-semibold">
              Estimated duration: ~{estimatedMinutes} min
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
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 py-1.5 px-3 font-semibold cursor-pointer font-body text-[12.5px] rounded-md transition-all duration-200 ${
        active
          ? "border border-accent bg-accent-light text-accent"
          : danger
            ? "border border-border bg-surface-alt text-error"
            : "border border-border bg-surface-alt text-text-secondary"
      }`}
    >
      {icon}
      {label}
    </m.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-text-muted text-[12.5px]">{label}:</span>
      <span className="font-bold text-text-secondary text-[12.5px]">{value}</span>
    </div>
  );
}
