"use client";

import { Calendar, Volume2 } from "lucide-react";
import { useMemo } from "react";

type Props = {
  onSelect: (word: string) => void;
};

type DailyWord = {
  word: string;
  phonetic: string;
  pos: string;
  definitionVi: string;
  example: string;
};

/**
 * A curated pool of interesting English words rotated by day.
 * The pool is large enough (~60) to avoid repetition for 2 months.
 */
const WORD_POOL: DailyWord[] = [
  {
    word: "serendipity",
    phonetic: "/ˌser.ənˈdɪp.ə.ti/",
    pos: "noun",
    definitionVi: "A fortunate stroke of accidental luck",
    example: "Finding that book was pure serendipity.",
  },
  {
    word: "eloquent",
    phonetic: "/ˈel.ə.kwənt/",
    pos: "adj",
    definitionVi: "Fluent or persuasive in speaking or writing",
    example: "She gave an eloquent speech at the conference.",
  },
  {
    word: "resilient",
    phonetic: "/rɪˈzɪl.i.ənt/",
    pos: "adj",
    definitionVi: "Able to withstand or recover quickly from difficult conditions",
    example: "Children are remarkably resilient to change.",
  },
  {
    word: "ubiquitous",
    phonetic: "/juːˈbɪk.wɪ.təs/",
    pos: "adj",
    definitionVi: "Present, appearing, or found everywhere",
    example: "Smartphones have become ubiquitous in modern life.",
  },
  {
    word: "ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    pos: "adj",
    definitionVi: "Lasting for a very short time",
    example: "Fame in social media is often ephemeral.",
  },
  {
    word: "pragmatic",
    phonetic: "/præɡˈmæt.ɪk/",
    pos: "adj",
    definitionVi: "Dealing with things sensibly and realistically",
    example: "We need a pragmatic approach to this problem.",
  },
  {
    word: "meticulous",
    phonetic: "/məˈtɪk.jə.ləs/",
    pos: "adj",
    definitionVi: "Showing great attention to detail; very careful and precise",
    example: "She is meticulous about her research methods.",
  },
  {
    word: "ambiguous",
    phonetic: "/æmˈbɪɡ.ju.əs/",
    pos: "adj",
    definitionVi: "Open to more than one interpretation; not having one obvious meaning",
    example: "The contract language was deliberately ambiguous.",
  },
  {
    word: "leverage",
    phonetic: "/ˈlev.ər.ɪdʒ/",
    pos: "verb",
    definitionVi: "Use something to maximum advantage",
    example: "We can leverage technology to improve efficiency.",
  },
  {
    word: "paradigm",
    phonetic: "/ˈpær.ə.daɪm/",
    pos: "noun",
    definitionVi: "A typical example or pattern of something; a model",
    example: "The internet created a new paradigm for communication.",
  },
  {
    word: "scrutinize",
    phonetic: "/ˈskruː.tə.naɪz/",
    pos: "verb",
    definitionVi: "Examine or inspect closely and thoroughly",
    example: "The committee will scrutinize every proposal.",
  },
  {
    word: "versatile",
    phonetic: "/ˈvɜː.sə.taɪl/",
    pos: "adj",
    definitionVi: "Able to adapt or be adapted to many different functions or activities",
    example: "Python is a versatile programming language.",
  },
  {
    word: "profound",
    phonetic: "/prəˈfaʊnd/",
    pos: "adj",
    definitionVi: "Very great or intense; having or showing great knowledge or insight",
    example: "The discovery had a profound impact on science.",
  },
  {
    word: "deteriorate",
    phonetic: "/dɪˈtɪə.ri.ə.reɪt/",
    pos: "verb",
    definitionVi: "Become progressively worse",
    example: "Air quality continues to deteriorate in urban areas.",
  },
  {
    word: "innovate",
    phonetic: "/ˈɪn.ə.veɪt/",
    pos: "verb",
    definitionVi: "Make changes in something established, especially by introducing new methods",
    example: "Companies must innovate to stay competitive.",
  },
  {
    word: "concise",
    phonetic: "/kənˈsaɪs/",
    pos: "adj",
    definitionVi: "Giving a lot of information clearly and in a few words",
    example: "Please keep your summary concise and clear.",
  },
  {
    word: "collaborate",
    phonetic: "/kəˈlæb.ə.reɪt/",
    pos: "verb",
    definitionVi: "Work jointly on an activity or project",
    example: "The two teams will collaborate on this project.",
  },
  {
    word: "phenomenon",
    phonetic: "/fɪˈnɒm.ɪ.nən/",
    pos: "noun",
    definitionVi: "A fact or situation that is observed to exist or happen",
    example: "Global warming is a well-documented phenomenon.",
  },
  {
    word: "contemplate",
    phonetic: "/ˈkɒn.tem.pleɪt/",
    pos: "verb",
    definitionVi: "Look thoughtfully for a long time at; think deeply about",
    example: "She sat by the window, contemplating her future.",
  },
  {
    word: "advocate",
    phonetic: "/ˈæd.və.keɪt/",
    pos: "verb",
    definitionVi: "Publicly recommend or support a particular cause or policy",
    example: "He advocates for equal access to education.",
  },
  {
    word: "diligent",
    phonetic: "/ˈdɪl.ɪ.dʒənt/",
    pos: "adj",
    definitionVi: "Having or showing care and conscientiousness in one's work or duties",
    example: "Diligent students tend to achieve their goals.",
  },
  {
    word: "sustainable",
    phonetic: "/səˈsteɪ.nə.bəl/",
    pos: "adj",
    definitionVi: "Able to be maintained at a certain rate or level",
    example: "We need sustainable solutions for energy production.",
  },
  {
    word: "inherent",
    phonetic: "/ɪnˈhɪə.rənt/",
    pos: "adj",
    definitionVi: "Existing in something as a permanent, essential, or characteristic attribute",
    example: "There are inherent risks in any investment.",
  },
  {
    word: "mitigate",
    phonetic: "/ˈmɪt.ɪ.ɡeɪt/",
    pos: "verb",
    definitionVi: "Make less severe, serious, or painful",
    example: "We must mitigate the effects of climate change.",
  },
  {
    word: "persevere",
    phonetic: "/ˌpɜː.sɪˈvɪər/",
    pos: "verb",
    definitionVi: "Continue in a course of action even in the face of difficulty",
    example: "You must persevere despite the challenges.",
  },
  {
    word: "nuance",
    phonetic: "/ˈnjuː.ɑːns/",
    pos: "noun",
    definitionVi: "A subtle difference in or shade of meaning, expression, or sound",
    example: "She understands the nuances of the language.",
  },
  {
    word: "consensus",
    phonetic: "/kənˈsen.səs/",
    pos: "noun",
    definitionVi: "A general agreement",
    example: "The committee reached a consensus on the issue.",
  },
  {
    word: "comprehensive",
    phonetic: "/ˌkɒm.prɪˈhen.sɪv/",
    pos: "adj",
    definitionVi: "Complete; including all or nearly all elements or aspects of something",
    example: "The report provides a comprehensive analysis.",
  },
  {
    word: "procrastinate",
    phonetic: "/prəˈkræs.tɪ.neɪt/",
    pos: "verb",
    definitionVi: "Delay or postpone action; put off doing something",
    example: "Stop procrastinating and start working on your essay.",
  },
  {
    word: "empathy",
    phonetic: "/ˈem.pə.θi/",
    pos: "noun",
    definitionVi: "The ability to understand and share the feelings of another",
    example: "A good leader shows empathy toward their team.",
  },
];

function getDayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % WORD_POOL.length;
}

export function WordOfTheDay({ onSelect }: Props) {
  const daily = useMemo(() => WORD_POOL[getDayIndex()], []);

  return (
    <div
      className="anim-fade-in rounded-lg bg-gradient-to-br from-accent-muted to-accent-light border border-accent p-4 px-4.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-px"
      onClick={() => onSelect(daily.word)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
          <Calendar className="h-3 w-3 text-accent-hover" />
          Word of the Day
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-ink border border-border">
          {daily.pos}
        </span>
      </div>

      {/* Word */}
      <div className="mt-2">
        <span className="text-[22px] font-bold italic font-display text-ink leading-tight">
          {daily.word}
        </span>
      </div>

      {/* Phonetic */}
      <div className="flex items-center gap-1.5 mt-1">
        <Volume2 className="h-3 w-3 text-text-muted" />
        <span className="text-xs font-mono text-text-secondary">{daily.phonetic}</span>
      </div>

      {/* Definition */}
      <p className="mt-2 text-[13px] font-semibold text-text-primary m-0">{daily.definitionVi}</p>

      {/* Example */}
      <p className="mt-1.5 text-xs italic text-text-muted leading-snug m-0">
        &ldquo;{daily.example}&rdquo;
      </p>

      {/* CTA */}
      <div className="mt-2.5 text-[11px] font-bold text-secondary text-right">View details →</div>
    </div>
  );
}
