export type Sm2State = {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReview: string; // ISO date string
};

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
