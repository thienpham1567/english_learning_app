"use client";

import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CefrLevel } from "@/lib/listening/types";
import { CEFR_LEVELS } from "@/lib/listening/types";

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
      className="mt-6 w-[600px] border-2 border-border bg-(--surface) max-w-full"
      style={{
        margin: "24px auto 0",
        padding: "20px 24px",
        borderRadius: "var(--radius-lg, 16px)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Users className="text-accent text-lg" />
        <div className="text-base font-bold text-text-primary">Multi-speaker dialogue</div>
      </div>
      <div className="text-sm text-text-muted mb-4 font-medium">
        Practice dialogue listening with 2–3 speakers featuring US, UK, and AU accents.
      </div>

      <Input
        placeholder="Topic (e.g., ordering coffee, job interview)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="mb-4 h-10 px-3 text-sm"
      />

      <div className="flex gap-4 flex-wrap mb-5 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted font-bold">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as CefrLevel)}
            className="h-8 rounded-lg border-2 border-border bg-surface-alt px-2.5 py-0.5 text-xs font-bold text-ink outline-none focus-visible:shadow-(--shadow-sm) focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] transition-all cursor-pointer"
          >
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted font-bold">Turns</span>
          <select
            value={turns}
            onChange={(e) => setTurns(Number(e.target.value) as 6 | 8 | 10)}
            className="h-8 rounded-lg border-2 border-border bg-surface-alt px-2.5 py-0.5 text-xs font-bold text-ink outline-none focus-visible:shadow-(--shadow-sm) focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] transition-all cursor-pointer"
          >
            <option value={6}>6</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted font-bold">Speakers</span>
          <select
            value={speakers}
            onChange={(e) => setSpeakers(Number(e.target.value) as 2 | 3)}
            className="h-8 rounded-lg border-2 border-border bg-surface-alt px-2.5 py-0.5 text-xs font-bold text-ink outline-none focus-visible:shadow-(--shadow-sm) focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] transition-all cursor-pointer"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>

      <Button
        onClick={() => canSubmit && onStart({ topic: topic.trim(), level, turns, speakers })}
        disabled={!canSubmit || isLoading}
        className="w-full h-11 text-sm font-extrabold flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        {isLoading ? "Generating dialogue..." : "Generate dialogue"}
      </Button>
    </div>
  );
}
