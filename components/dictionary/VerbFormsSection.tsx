"use client";

import { useRef, useState } from "react";
import { Tag } from "antd";
import { ChevronDown, Loader2, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { VerbForm } from "@/lib/schemas/vocabulary";

type Props = {
  verbForms: VerbForm[];
};

export function VerbFormsSection({ verbForms }: Props) {
  const [open, setOpen] = useState(false);
  const [speakingForm, setSpeakingForm] = useState<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function speak(form: string) {
    if (activeUtteranceRef.current) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    const utterance = new SpeechSynthesisUtterance(form);
    utterance.lang = "en-US";
    utterance.onstart = () => setSpeakingForm(form);
    utterance.onend = () => {
      setSpeakingForm(null);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingForm(null);
      activeUtteranceRef.current = null;
    };
    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <motion.div
      className="mt-5"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.3 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2"
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-(--accent)">
          DẠNG ĐỘNG TỪ
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-(--text-muted)">{verbForms.length} dạng</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`text-(--text-muted) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="verb-forms-grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-3 lg:grid-cols-5">
              {verbForms.map((vf) => (
                <div
                  key={vf.label}
                  className="flex flex-col gap-1.5 rounded-(--radius-lg) bg-(--bg-deep) px-3.5 py-3"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wide text-(--text-muted)">
                    {vf.label}
                  </span>
                  <span className="text-sm font-semibold text-(--ink)">
                    {vf.form}
                  </span>
                  {(vf.phoneticsUs || vf.phoneticsUk) && (
                    <div className="flex flex-col gap-0.5">
                      {vf.phoneticsUs && (
                        <span className="text-xs [font-family:var(--font-mono)] text-(--accent)">
                          🇺🇸 {vf.phoneticsUs}
                        </span>
                      )}
                      {vf.phoneticsUk && (
                        <span className="text-xs [font-family:var(--font-mono)] text-(--accent)">
                          🇬🇧 {vf.phoneticsUk}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Play pronunciation of ${vf.form}`}
                      onClick={() => speak(vf.form)}
                      className="grid size-6 place-items-center rounded text-(--text-muted) transition hover:text-(--accent)"
                    >
                      {speakingForm === vf.form ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Volume2 size={13} />
                      )}
                    </button>
                    {vf.isIrregular && (
                      <Tag
                        color="orange"
                        className="!m-0 !text-[10px] !px-1.5 !py-0 !leading-4"
                      >
                        Bất quy tắc
                      </Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
