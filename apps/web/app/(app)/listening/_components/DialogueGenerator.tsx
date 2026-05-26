"use client";

import { useState } from "react";

import { Select, Input, Button } from "antd";
import { CEFR_LEVELS } from "@/lib/listening/types";
import type { CefrLevel } from "@/lib/listening/types";
import { Users } from "lucide-react";

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
    <div className="mt-6 w-[600px] border border-(--border) bg-(--surface)" style={{margin: "24px auto 0", padding: "20px 24px", borderRadius: "var(--radius-lg, 16px)"}} >
      <div className="flex items-center gap-2 mb-3" >
        <Users className="text-accent text-lg" />
        <div className="text-base font-bold" style={{color: "var(--text)"}} >
          Multi-speaker dialogue
        </div>
      </div>
      <div className="text-sm text-text-muted mb-4" >
        Luyện nghe hội thoại 2–3 giọng với các giọng Mỹ, Anh, Úc.
      </div>

      <Input
        placeholder="Chủ đề (ví dụ: ordering coffee, job interview)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        size="large" className="mb-4" />

      <div className="flex gap-4 flex-wrap mb-5 items-center" >
        <div className="flex items-center gap-2" >
          <span className="text-[13px] text-text-muted" >Level</span>
          <Select
            value={level}
            onChange={(val) => setLevel(val as CefrLevel)}
            options={CEFR_LEVELS.map(l => ({ value: l, label: l }))} className="w-[80px]" />
        </div>
        <div className="flex items-center gap-2" >
          <span className="text-[13px] text-text-muted" >Turns</span>
          <Select
            value={turns}
            onChange={(val) => setTurns(val as 6 | 8 | 10)}
            options={[
              { value: 6, label: "6" },
              { value: 8, label: "8" },
              { value: 10, label: "10" }
            ]} className="w-[70px]" />
        </div>
        <div className="flex items-center gap-2" >
          <span className="text-[13px] text-text-muted" >Speakers</span>
          <Select
            value={speakers}
            onChange={(val) => setSpeakers(val as 2 | 3)}
            options={[
              { value: 2, label: "2" },
              { value: 3, label: "3" }
            ]} className="w-[70px]" />
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={() => canSubmit && onStart({ topic: topic.trim(), level, turns, speakers })}
        disabled={!canSubmit}
        loading={isLoading}
        icon={<Users />} className="font-semibold border-none" style={{background: canSubmit ? "var(--accent)" : "var(--border)", color: canSubmit ? "var(--text-on-accent)" : "var(--text-muted)"}} >
        Generate dialogue
      </Button>
    </div>
  );
}
