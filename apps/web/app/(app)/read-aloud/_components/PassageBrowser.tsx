"use client";

import { BookOpen, Loader2, Sparkles } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  SAMPLE_TEXTS,
  type SampleLength,
  type SampleText,
  TOEIC_TOPICS,
} from "../_data/sample-passages";

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
        toast.success(`Generated ${data.passages.length} new passages with AI!`);
      }
    } catch {
      toast.error("Failed to generate passages. Please try again.");
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
      className="read-aloud-panel bg-surface border-2 border-border flex flex-col gap-4 p-5 shadow-[4px_4px_0_var(--shadow-color)]"
    >
      {/* Header + AI Generate Button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-mono text-[11px] font-bold text-text-muted uppercase tracking-[0.18em] flex items-center gap-1.5">
          <BookOpen size={13} className="text-accent" />
          Đoạn mẫu ({filteredPassages.length})
        </span>
        <m.button
          whileHover={{ x: -1, y: -1 }}
          whileTap={{ x: 0, y: 0 }}
          onClick={generateAiPassages}
          disabled={aiLoading}
          className={`flex items-center gap-1.5 text-accent-active font-mono font-black uppercase tracking-wide py-1.5 px-4 text-[11px] border-2 border-border bg-accent-light shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-none ${
            aiLoading ? "cursor-wait opacity-60" : "cursor-pointer opacity-100"
          }`}
        >
          {aiLoading ? (
            <>
              <Loader2 className="animate-spin" size={12} /> Đang tạo…
            </>
          ) : (
            <>
              <Sparkles size={12} /> Tạo bằng AI
            </>
          )}
        </m.button>
      </div>

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
      <div className="flex gap-1.5 items-center flex-wrap">
        <span className="font-mono text-[10px] text-text-muted font-bold uppercase tracking-wide">
          Độ dài:
        </span>
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
      </div>

      {/* Passage cards */}
      <div className="flex flex-col gap-2 h-[400px] overflow-y-auto pr-1">
        {filteredPassages.length === 0 ? (
          <div className="text-center text-text-muted font-mono text-[12px] py-6 px-4 border-2 border-dashed border-border">
            Chưa có đoạn nào. Bấm &quot;Tạo bằng AI&quot; để sinh đoạn mới!
          </div>
        ) : (
          filteredPassages.map((sample, idx) => (
            <m.div
              key={`${sample.topic}-${idx}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              whileHover={{ x: -1, y: -1 }}
              onClick={() => {
                onSelectPassage(sample.text, sample.title);
                toast.success(`Loaded: ${sample.title}`);
              }}
              className="flex items-start gap-3 border-2 border-border bg-surface-alt cursor-pointer py-3 px-3.5 shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 hover:bg-accent-light hover:shadow-[3px_3px_0_var(--shadow-color)]"
            >
              <div className="w-9 h-9 border-2 border-border grid place-items-center text-lg shrink-0 bg-accent-light">
                {sample.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-text-primary text-[13.5px] leading-tight">
                  {sample.title}
                </div>
                <div className="text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                  {sample.text.slice(0, 80)}...
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span
                    className="text-[10px] font-black font-mono uppercase py-px px-2"
                    style={{
                      background:
                        sample.length === "short"
                          ? "color-mix(in srgb, var(--success) 10%, transparent)"
                          : sample.length === "long"
                            ? "color-mix(in srgb, var(--error) 8%, transparent)"
                            : "color-mix(in srgb, var(--info) 10%, transparent)",
                      color:
                        sample.length === "short"
                          ? "var(--success)"
                          : sample.length === "long"
                            ? "var(--error)"
                            : "var(--info)",
                      border: `1px solid ${sample.length === "short" ? "color-mix(in srgb, var(--success) 20%, transparent)" : sample.length === "long" ? "color-mix(in srgb, var(--error) 15%, transparent)" : "color-mix(in srgb, var(--info) 20%, transparent)"}`,
                    }}
                  >
                    {sample.length === "short"
                      ? "Short"
                      : sample.length === "long"
                        ? "Long"
                        : "Medium"}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted">
                    ~{sample.text.split(/\s+/).length} words
                  </span>
                </div>
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
      className={`cursor-pointer font-mono py-1 px-3 text-[11px] whitespace-nowrap border-2 transition-all duration-150 ${
        active
          ? "border-border bg-accent text-text-on-accent font-black shadow-[2px_2px_0_var(--shadow-color)]"
          : "border-border bg-surface text-text-muted font-bold hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
