"use client";

import { Check, Loader2, Plus } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { FamilyWord } from "@/lib/morphology/schema";

/** Highlights the morpheme substring inside a sentence/word. */
export function Highlighted({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight) return <>{text}</>;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "i"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i} className="text-accent-active border-b-2 border-accent-active">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** A word-family entry with a one-tap "save to vocabulary" action. */
export function FamilyRow({ fw }: { fw: FamilyWord }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (saving || saved) return;
    setSaving(true);
    const word = fw.word.trim().toLowerCase();
    try {
      // Cache the word (dictionary lookup) then mark it saved.
      await api.post("/dictionary", { word });
      await api.post("/vocabulary/save", { query: word });
      setSaved(true);
      toast.success(`Saved "${fw.word}" to your vocabulary`);
    } catch {
      toast.error(`Couldn't save "${fw.word}"`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-surface-alt border border-border p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-text-primary text-[15px]">{fw.word}</span>
            <span className="text-[11px] font-bold text-text-muted italic">{fw.partOfSpeech}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-text-secondary font-semibold">{fw.meaningVi}</p>
        </div>
        <m.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={save}
          disabled={saving || saved}
          aria-label={saved ? "Saved" : "Save word"}
          className={`w-8 h-8 grid place-items-center rounded-lg border shrink-0 transition-colors ${
            saved
              ? "border-success/40 bg-success/10 text-success cursor-default"
              : "border-border bg-surface text-accent-active hover:bg-accent-light cursor-pointer"
          }`}
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <Check size={15} />
          ) : (
            <Plus size={15} />
          )}
        </m.button>
      </div>
      <p className="mt-2 text-[13.5px] text-text-primary leading-normal">
        <Highlighted text={fw.exampleEn} highlight={fw.highlight} />
      </p>
    </div>
  );
}
