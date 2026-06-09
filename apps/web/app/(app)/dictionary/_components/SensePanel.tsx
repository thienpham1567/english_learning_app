"use client";

import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Code,
  Lightbulb,
  Link as LinkIcon,
  Pencil,
  Zap,
} from "lucide-react";
import { useState } from "react";

import type { DictionarySense } from "@/lib/schemas/vocabulary";
import { parseBold } from "@/lib/utils/parse-bold";

type SensePanelProps = {
  sense: DictionarySense;
  headword: string;
  onSearch?: (word: string) => void;
};

export const SENSE_HEADER_STYLE =
  "flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink m-0";

function BoldText({ text }: { text: string }) {
  const segments = parseBold(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold not-italic">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/** Highlight occurrences of `headword` within `text` using accent color */
function HighlightWord({ text, headword }: { text: string; headword: string }) {
  if (!headword) return <BoldText text={text} />;

  const boldSegments = parseBold(text);
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headwordRegex = new RegExp(`(${escaped})`, "gi");

  return (
    <>
      {boldSegments.map((seg, si) => {
        const subParts = seg.text.split(headwordRegex);
        if (subParts.length <= 1) {
          return seg.bold ? (
            <strong key={si} className="font-semibold not-italic">
              {seg.text}
            </strong>
          ) : (
            <span key={si}>{seg.text}</span>
          );
        }
        return subParts.map((sub, pi) => {
          const key = `${si}-${pi}`;
          if (sub.toLowerCase() === headword.toLowerCase()) {
            return (
              <mark key={key} className="bg-accent/20 text-ink px-1 rounded font-bold not-italic">
                {sub}
              </mark>
            );
          }
          return seg.bold ? (
            <strong key={key} className="font-semibold not-italic">
              {sub}
            </strong>
          ) : (
            <span key={key}>{sub}</span>
          );
        });
      })}
    </>
  );
}

export function SensePanel({ sense, headword, onSearch }: SensePanelProps) {
  const [isCollocationsOpen, setIsCollocationsOpen] = useState(false);
  const [isThesaurusOpen, setIsThesaurusOpen] = useState(false);
  const examples = sense.examples ?? [];
  const examplesVi = sense.examplesVi ?? [];
  const collocations = sense.collocations ?? [];
  const synonyms = sense.synonyms ?? [];
  const antonyms = sense.antonyms ?? [];
  const hasThesaurus = synonyms.length > 0 || antonyms.length > 0;

  const shortMeanings = sense.shortMeaningsVi ?? [];

  return (
    <div className="anim-fade-up flex flex-col gap-7">
      {shortMeanings.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 gap-y-2">
          {shortMeanings.map((meaning, i) => (
            <span
              key={meaning}
              className={
                i === 0
                  ? "rounded-lg border-2 border-border bg-accent-light px-3.5 py-1 text-sm font-extrabold font-display text-ink whitespace-nowrap shadow-sm"
                  : "text-sm text-text-secondary font-semibold leading-snug"
              }
            >
              {meaning}
            </span>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-2 rounded-lg border-l-3 border-l-accent bg-bg-deep p-4 px-5">
        <h3 className={SENSE_HEADER_STYLE}>
          <BookOpen className="h-3 w-3" />
          Definition in English
        </h3>
        <p className="text-sm leading-relaxed text-text-primary m-0">
          <BoldText text={sense.definitionEn} />
        </p>
      </section>

      {(examples.length > 0 || examplesVi.length > 0) && (
        <section className="flex flex-col gap-2">
          <h3 className={SENSE_HEADER_STYLE}>
            <Pencil className="h-3 w-3" />
            Examples
          </h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {examples.length > 0
              ? examples.map((example, i) => (
                  <li
                    key={`${example.en}-${example.vi ?? i}`}
                    className="border-l-2 border-l-accent-muted pl-4 text-sm italic leading-relaxed text-text-secondary"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span>
                        <HighlightWord text={example.en} headword={headword} />
                      </span>
                      {example.vi && (
                        <span className="text-[13px] text-text-muted not-italic">
                          <BoldText text={example.vi} />
                        </span>
                      )}
                    </div>
                  </li>
                ))
              : examplesVi.map((example) => (
                  <li
                    key={example}
                    className="border-l-2 border-l-accent-muted pl-4 text-sm italic leading-relaxed text-text-secondary"
                  >
                    <BoldText text={example} />
                  </li>
                ))}
          </ul>
        </section>
      )}

      {sense.usageNoteVi && (
        <section className="flex flex-col gap-2 rounded-lg bg-bg-deep p-4 px-5">
          <h3 className={SENSE_HEADER_STYLE}>
            <Lightbulb className="h-3 w-3" />
            Usage Notes
          </h3>
          <p className="text-sm leading-relaxed text-text-primary m-0">
            <BoldText text={sense.usageNoteVi} />
          </p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className={SENSE_HEADER_STYLE}>
            <Code className="h-3 w-3" />
            Common Patterns
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sense.patterns.map((pattern) => (
              <span
                key={pattern}
                className="font-mono text-xs bg-bg-deep border-2 border-border rounded px-2.5 py-1 text-text-secondary whitespace-nowrap"
              >
                {pattern}
              </span>
            ))}
          </div>
        </section>
      )}

      {collocations.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className={SENSE_HEADER_STYLE}>
            <Zap className="h-3 w-3" />
            Collocations
          </h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {(isCollocationsOpen ? collocations : collocations.slice(0, 3)).map((collocation) => (
              <li key={`${collocation.en}-${collocation.vi}`} className="text-sm leading-relaxed">
                <span className="text-text-primary">
                  <BoldText text={collocation.en} />
                </span>
                <span className="mx-1.5 text-text-muted">&mdash;</span>
                <span className="text-text-secondary">
                  <BoldText text={collocation.vi} />
                </span>
              </li>
            ))}
          </ul>
          {collocations.length > 3 && (
            <button
              type="button"
              aria-expanded={isCollocationsOpen}
              onClick={() => setIsCollocationsOpen((open) => !open)}
              className="inline-flex items-center rounded-lg border-2 border-border bg-surface px-3 py-1 text-xs font-bold text-ink cursor-pointer w-fit hover:bg-accent-light transition-colors shadow-sm"
            >
              {isCollocationsOpen ? "Show Less" : `Show More (${collocations.length - 3})`}
            </button>
          )}
        </section>
      )}

      {/* ── Inline Thesaurus: Synonyms & Antonyms ── */}
      {hasThesaurus && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsThesaurusOpen((o) => !o)}
            aria-expanded={isThesaurusOpen}
            className="flex w-full items-center justify-between gap-2 bg-transparent border-none cursor-pointer p-0 transition-all duration-200 hover:opacity-80 text-left"
          >
            <h3 className={SENSE_HEADER_STYLE}>
              <BookOpen className="h-3 w-3" />
              Synonyms & Antonyms
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-light text-accent-active border-2 border-accent/20 normal-case tracking-normal">
                {synonyms.length + antonyms.length}
              </span>
            </h3>
            <ChevronDown
              className={`h-3.5 w-3.5 text-text-muted transition-transform duration-300 ${isThesaurusOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isThesaurusOpen && (
            <div className="anim-fade-in flex flex-col gap-4 pt-1">
              {synonyms.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-success m-0">
                    Synonyms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {synonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => onSearch?.(word)}
                        className="rounded-lg bg-success/5 px-3 py-1 text-[13px] font-bold text-success border-2 border-success/20 cursor-pointer transition-all duration-150 hover:bg-success/15 hover:border-success/40"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {antonyms.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warning m-0">
                    Antonyms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {antonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => onSearch?.(word)}
                        className="rounded-lg bg-xp/5 px-3 py-1 text-[13px] font-bold text-warning border-2 border-dashed border-warning/20 cursor-pointer transition-all duration-150 hover:bg-warning/15 hover:border-warning/40"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className={SENSE_HEADER_STYLE}>
            <LinkIcon className="h-3 w-3" />
            Related Expressions
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sense.relatedExpressions.map((expr) => (
              <button
                key={expr}
                type="button"
                onClick={() => onSearch?.(expr)}
                className="rounded-lg border-2 border-border bg-surface px-3.5 py-1 text-[13px] font-bold font-display text-ink cursor-pointer transition-colors duration-150 hover:bg-accent-light shadow-sm"
              >
                {expr}
              </button>
            ))}
          </div>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="flex flex-col gap-2.5 rounded-lg bg-warning-bg border-2 border-warning p-3.5 px-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-warning m-0">
            <AlertTriangle className="h-3 w-3" />
            Common Mistakes
          </h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {sense.commonMistakesVi.map((mistake) => (
              <li
                key={mistake}
                className="border-l-2 border-l-warning pl-3 text-[13px] leading-relaxed text-text-secondary font-medium"
              >
                <BoldText text={mistake} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
