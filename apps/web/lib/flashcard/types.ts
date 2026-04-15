/**
 * Re-export from shared SRS module for backward compatibility.
 * New code should import from "@/lib/srs" directly.
 */
export type { Sm2State } from "@/lib/srs/types";

export type DueCard = {
  query: string;
  headword: string;
  phonetic: string | null;
  phoneticsUs: string | null;
  phoneticsUk: string | null;
  partOfSpeech: string | null;
  level: string | null;
  overviewVi: string;
  overviewEn: string;
  senses: {
    id: string;
    label: string;
    definitionVi: string;
    definitionEn: string;
    examples: { en: string; vi: string }[];
    collocations: { en: string; vi: string }[];
  }[];
};
