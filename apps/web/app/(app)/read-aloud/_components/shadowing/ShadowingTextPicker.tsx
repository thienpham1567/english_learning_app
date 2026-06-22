"use client";

import { Mic } from "lucide-react";
import * as m from "motion/react-client";
import { PassageBrowser } from "../PassageBrowser";

const MAX_CHARS = 10_000;

interface ShadowingTextPickerProps {
  text: string;
  onTextChange: (text: string) => void;
}

/**
 * Inline passage entry for Shadowing mode — lets the learner paste/type a
 * passage or pick a sample without leaving the tab. Shown until text exists.
 */
export function ShadowingTextPicker({ text, onTextChange }: ShadowingTextPickerProps) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border shadow-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-accent-light border border-border grid place-items-center shrink-0 shadow-sm">
            <Mic className="text-accent-active" size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold uppercase tracking-tight text-text-primary text-base leading-tight">
              Luyện Shadowing
            </h3>
            <p className="text-text-secondary text-[12.5px]">
              Dán đoạn văn hoặc chọn mẫu bên dưới, rồi lặp lại từng câu theo giọng bản xứ.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={"Dán hoặc gõ đoạn tiếng Anh để shadow…\n\nHoặc chọn đoạn mẫu bên dưới."}
          maxLength={MAX_CHARS}
          className="read-aloud-textarea w-full h-[220px] text-base font-body leading-[1.75] outline-none p-4 border border-border bg-surface-alt text-ink focus:border-accent transition-colors"
          style={{ resize: "vertical" }}
        />

        <div className="flex items-center justify-between px-1 font-mono text-[11px] uppercase tracking-wide text-text-muted">
          <span>
            Words:{" "}
            <span className="font-bold text-text-secondary">{wordCount.toLocaleString()}</span>
          </span>
          <span>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </m.div>

      <PassageBrowser onSelectPassage={(passageText) => onTextChange(passageText)} />
    </div>
  );
}
