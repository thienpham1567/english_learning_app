import type { MorphemeType } from "@/lib/morphology/schema";

export interface MorphemeCatalogItem {
  id: string;
  morpheme: string;
  type: MorphemeType;
  gloss: string;
  example: string;
}

/** Curated, high-value morphemes grouped by type. ids are stable cache keys. */
export const MORPHEMES: MorphemeCatalogItem[] = [
  // ── Prefixes ──
  { id: "prefix-un", morpheme: "un-", type: "prefix", gloss: "not / opposite", example: "unhappy" },
  { id: "prefix-re", morpheme: "re-", type: "prefix", gloss: "again / back", example: "rewrite" },
  { id: "prefix-in", morpheme: "in-", type: "prefix", gloss: "not / into", example: "invisible" },
  { id: "prefix-dis", morpheme: "dis-", type: "prefix", gloss: "not / apart", example: "disagree" },
  { id: "prefix-pre", morpheme: "pre-", type: "prefix", gloss: "before", example: "preview" },
  {
    id: "prefix-mis",
    morpheme: "mis-",
    type: "prefix",
    gloss: "wrongly",
    example: "misunderstand",
  },
  {
    id: "prefix-over",
    morpheme: "over-",
    type: "prefix",
    gloss: "too much / above",
    example: "overwork",
  },
  {
    id: "prefix-under",
    morpheme: "under-",
    type: "prefix",
    gloss: "too little / below",
    example: "underestimate",
  },
  {
    id: "prefix-sub",
    morpheme: "sub-",
    type: "prefix",
    gloss: "under / below",
    example: "submarine",
  },
  {
    id: "prefix-inter",
    morpheme: "inter-",
    type: "prefix",
    gloss: "between",
    example: "international",
  },
  { id: "prefix-trans", morpheme: "trans-", type: "prefix", gloss: "across", example: "transport" },
  {
    id: "prefix-co",
    morpheme: "co-",
    type: "prefix",
    gloss: "together / with",
    example: "cooperate",
  },

  // ── Suffixes ──
  {
    id: "suffix-tion",
    morpheme: "-tion",
    type: "suffix",
    gloss: "forms a noun (action/result)",
    example: "decision",
  },
  {
    id: "suffix-ment",
    morpheme: "-ment",
    type: "suffix",
    gloss: "forms a noun (state/action)",
    example: "movement",
  },
  {
    id: "suffix-ness",
    morpheme: "-ness",
    type: "suffix",
    gloss: "forms a noun (quality)",
    example: "happiness",
  },
  {
    id: "suffix-ity",
    morpheme: "-ity",
    type: "suffix",
    gloss: "forms a noun (state)",
    example: "ability",
  },
  {
    id: "suffix-er",
    morpheme: "-er",
    type: "suffix",
    gloss: "one who / agent",
    example: "teacher",
  },
  {
    id: "suffix-able",
    morpheme: "-able",
    type: "suffix",
    gloss: "forms an adjective (capable of)",
    example: "comfortable",
  },
  {
    id: "suffix-ful",
    morpheme: "-ful",
    type: "suffix",
    gloss: "forms an adjective (full of)",
    example: "careful",
  },
  {
    id: "suffix-ive",
    morpheme: "-ive",
    type: "suffix",
    gloss: "forms an adjective (tending to)",
    example: "creative",
  },
  {
    id: "suffix-ous",
    morpheme: "-ous",
    type: "suffix",
    gloss: "forms an adjective (having)",
    example: "dangerous",
  },
  {
    id: "suffix-ize",
    morpheme: "-ize",
    type: "suffix",
    gloss: "forms a verb (make)",
    example: "modernize",
  },
  {
    id: "suffix-ify",
    morpheme: "-ify",
    type: "suffix",
    gloss: "forms a verb (make)",
    example: "simplify",
  },
  {
    id: "suffix-ly",
    morpheme: "-ly",
    type: "suffix",
    gloss: "forms an adverb",
    example: "quickly",
  },

  // ── Roots ──
  { id: "root-spect", morpheme: "spect", type: "root", gloss: "to look", example: "inspect" },
  { id: "root-port", morpheme: "port", type: "root", gloss: "to carry", example: "transport" },
  { id: "root-dict", morpheme: "dict", type: "root", gloss: "to say / speak", example: "predict" },
  { id: "root-struct", morpheme: "struct", type: "root", gloss: "to build", example: "construct" },
  { id: "root-ject", morpheme: "ject", type: "root", gloss: "to throw", example: "reject" },
  { id: "root-vert", morpheme: "vert", type: "root", gloss: "to turn", example: "convert" },
  { id: "root-form", morpheme: "form", type: "root", gloss: "shape", example: "transform" },
  { id: "root-graph", morpheme: "graph", type: "root", gloss: "to write", example: "autograph" },
];

export const MORPHEME_TYPE_LABELS: Record<MorphemeType, string> = {
  prefix: "Prefixes",
  suffix: "Suffixes",
  root: "Roots",
};

export const MORPHEME_TYPE_ORDER: MorphemeType[] = ["prefix", "suffix", "root"];

export const MORPHEMES_BY_TYPE: Record<MorphemeType, MorphemeCatalogItem[]> = {
  prefix: MORPHEMES.filter((m) => m.type === "prefix"),
  suffix: MORPHEMES.filter((m) => m.type === "suffix"),
  root: MORPHEMES.filter((m) => m.type === "root"),
};

export function getMorphemeById(id: string): MorphemeCatalogItem | undefined {
  return MORPHEMES.find((m) => m.id === id);
}
