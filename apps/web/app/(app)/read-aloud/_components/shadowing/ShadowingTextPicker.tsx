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
        className="bg-surface rounded-xl border-2 border-border shadow-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light border-2 border-accent/20 grid place-items-center shrink-0">
            <Mic className="text-accent" size={20} />
          </div>
          <div>
            <h3 className="text-text-primary font-black text-base leading-tight">
              Shadowing Practice
            </h3>
            <p className="text-text-secondary text-[12.5px]">
              Paste a passage or pick a sample below, then repeat each sentence after the native
              model.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            "Paste or type an English passage to shadow…\n\nOr choose a sample passage below."
          }
          maxLength={MAX_CHARS}
          className="read-aloud-textarea w-full h-[220px] text-base font-body leading-[1.75] outline-none p-4"
          style={{ resize: "vertical" }}
        />

        <div className="flex items-center justify-between px-1 text-[12.5px] text-text-muted">
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
