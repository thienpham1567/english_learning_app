"use client";

import { ChevronDown, Loader2, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/lib/api-client";

import type { VerbForm } from "@/lib/schemas/vocabulary";

type Props = {
  verbForms: VerbForm[];
};

export function VerbFormsSection({ verbForms }: Props) {
  const [open, setOpen] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioRef = useRef<{ el: HTMLAudioElement | null; url: string | null }>({
    el: null,
    url: null,
  });

  async function speak(form: string, locale: "en-US" | "en-GB") {
    const key = `${form}-${locale}`;

    // Stop any active audio
    activeAudioRef.current.el?.pause();
    if (activeAudioRef.current.url) {
      URL.revokeObjectURL(activeAudioRef.current.url);
      activeAudioRef.current.url = null;
    }
    if (activeUtteranceRef.current) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    setSpeakingKey(key);
    const accent = locale === "en-GB" ? "uk" : "us";

    try {
      const response = await api.post<Response>(
        "/voice/synthesize",
        { text: form, accent },
        { raw: true },
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      activeAudioRef.current.url = url;
      const audio = new Audio(url);
      activeAudioRef.current.el = audio;
      audio.onended = () => {
        setSpeakingKey((curr) => (curr === key ? null : curr));
        URL.revokeObjectURL(url);
        if (activeAudioRef.current.url === url) activeAudioRef.current.url = null;
      };
      audio.onerror = () => {
        setSpeakingKey((curr) => (curr === key ? null : curr));
        URL.revokeObjectURL(url);
        if (activeAudioRef.current.url === url) activeAudioRef.current.url = null;
      };
      await audio.play();
    } catch {
      // Fallback to browser speechSynthesis
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(form);
        utterance.lang = locale;
        utterance.rate = 0.9;
        utterance.onend = () => {
          setSpeakingKey((curr) => (curr === key ? null : curr));
          activeUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setSpeakingKey((curr) => (curr === key ? null : curr));
          activeUtteranceRef.current = null;
        };
        activeUtteranceRef.current = utterance;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return;
      }
      setSpeakingKey((curr) => (curr === key ? null : curr));
    }
  }

  return (
    <div className="anim-fade-up mt-6">
      {/* ── Expand toggle — prominent section header ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="verb-forms-grid"
        className="flex w-full items-center justify-between gap-2 bg-surface border-2 border-border border-l-3 border-l-accent rounded-sm cursor-pointer px-4 py-2.5 transition-all duration-200 hover:bg-surface-hover hover:shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-black uppercase tracking-[0.12em] text-text-secondary">
            Verb Forms
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent-light text-text-secondary border border-accent/20">
            {verbForms.length} forms
          </span>
        </div>
        <ChevronDown
          className={`h-3 w-3 text-text-secondary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div id="verb-forms-grid" className="anim-fade-in verb-forms-grid grid gap-2.5 pt-3.5">
          {verbForms.map((vf, idx) => {
            const isInfinitive = idx === 0;
            const cardClass = isInfinitive
              ? "bg-accent-light border border-accent/50 border-l-4 border-l-accent"
              : vf.isIrregular
                ? "bg-amber-500/5 border border-amber-500/20"
                : "bg-surface-alt border-2 border-border";

            return (
              <div
                key={vf.label}
                className={`flex flex-col gap-1.5 rounded-lg p-3.5 px-4 transition-shadow duration-200 min-h-[110px] ${cardClass}`}
              >
                {/* Label */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider leading-none ${isInfinitive ? "text-text-secondary" : "text-text-muted"}`}
                >
                  {vf.label}
                </span>

                {/* Form word */}
                <span
                  className={`mt-0.5 ${isInfinitive ? "text-base font-bold font-display italic" : "text-sm font-semibold"} text-ink`}
                >
                  {vf.form}
                </span>

                {/* Phonetics with inline audio buttons */}
                {(vf.phoneticsUs || vf.phoneticsUk) && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    {vf.phoneticsUs && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-text-muted min-w-4">US</span>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {vf.phoneticsUs}
                        </span>
                        <MiniAudioBtn
                          isPlaying={speakingKey === `${vf.form}-en-US`}
                          onClick={() => speak(vf.form, "en-US")}
                          label={`US pronunciation of ${vf.form}`}
                        />
                      </div>
                    )}
                    {vf.phoneticsUk && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-text-muted min-w-4">UK</span>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {vf.phoneticsUk}
                        </span>
                        <MiniAudioBtn
                          isPlaying={speakingKey === `${vf.form}-en-GB`}
                          onClick={() => speak(vf.form, "en-GB")}
                          label={`UK pronunciation of ${vf.form}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: irregular badge — pushed to bottom */}
                {vf.isIrregular && (
                  <div className="flex items-center gap-1.5 mt-auto pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20 whitespace-nowrap">
                      Irregular
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Tiny audio play button inline with phonetics */
function MiniAudioBtn({
  isPlaying,
  onClick,
  label,
}: {
  isPlaying: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-grid w-4.5 h-4.5 place-items-center rounded border-none bg-transparent p-0 cursor-pointer shrink-0 transition-colors duration-150 ${
        isPlaying ? "text-accent" : "text-text-muted hover:text-accent"
      }`}
    >
      {isPlaying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
    </button>
  );
}
