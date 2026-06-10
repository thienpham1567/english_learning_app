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
      className="read-aloud-panel bg-surface rounded-xl border-2 border-border flex flex-col gap-4 p-5 shadow-md"
    >
      {/* Header + AI Generate Button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={14} className="text-accent" />
          Sample Passages ({filteredPassages.length})
        </span>
        <m.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={generateAiPassages}
          disabled={aiLoading}
          className={`flex items-center gap-1.5 rounded-xl text-accent font-bold font-body py-1.5 px-4 text-[12.5px] border-2 border-accent bg-accent-light transition-all duration-200 ${
            aiLoading ? "cursor-wait opacity-60" : "cursor-pointer opacity-100"
          }`}
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
      <div className="flex gap-1.5 items-center">
        <span className="text-[11px] text-text-muted font-semibold">Length:</span>
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
      <div className="flex flex-col gap-2 h-[400px] overflow-y-auto">
        {filteredPassages.length === 0 ? (
          <div className="text-center text-text-muted text-[13px] py-6 px-4 rounded-[14px] border border-dashed border-border">
            No passages found. Click &quot;Generate with AI&quot; to create new ones!
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
                toast.success(`Loaded: ${sample.title}`);
              }}
              className="flex items-start gap-3 rounded-lg border-2 border-border bg-surface-alt cursor-pointer py-3 px-3.5 transition-all duration-150"
            >
              <div className="w-9 h-9 border-2 border-border grid place-items-center text-lg shrink-0 rounded-xl bg-accent-light">
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
                    className="text-[10px] font-bold rounded-lg py-px px-2"
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
      className={`rounded-lg cursor-pointer font-body py-1 px-3 text-[11.5px] whitespace-nowrap transition-all duration-200 ${
        active
          ? "border-2 border-accent bg-accent-muted text-accent font-bold"
          : "border-2 border-border bg-transparent text-text-muted font-medium"
      }`}
    >
      {label}
    </button>
  );
}
