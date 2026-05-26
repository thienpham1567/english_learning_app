export type PhonemeType = "consonant" | "vowel";
export type ConsonantSubtype =
  | "plosive"
  | "fricative"
  | "affricate"
  | "nasal"
  | "lateral"
  | "approximant";
export type VowelSubtype = "monophthong-short" | "monophthong-long" | "diphthong";

export type IpaPhoneme = {
  symbol: string;
  type: PhonemeType;
  subtype: ConsonantSubtype | VowelSubtype;
  voiced: boolean;
  exampleWord: string;
  exampleHighlight: string;
  tip: string;
};

// ── Consonants (24 phonemes) ──

export const CONSONANTS: IpaPhoneme[] = [
  // Plosives
  {
    symbol: "p",
    type: "consonant",
    subtype: "plosive",
    voiced: false,
    exampleWord: "pen",
    exampleHighlight: "p",
    tip: "Lips together, burst of air",
  },
  {
    symbol: "b",
    type: "consonant",
    subtype: "plosive",
    voiced: true,
    exampleWord: "boy",
    exampleHighlight: "b",
    tip: "Lips together, vibrate vocal cords",
  },
  {
    symbol: "t",
    type: "consonant",
    subtype: "plosive",
    voiced: false,
    exampleWord: "ten",
    exampleHighlight: "t",
    tip: "Tongue tip behind upper teeth",
  },
  {
    symbol: "d",
    type: "consonant",
    subtype: "plosive",
    voiced: true,
    exampleWord: "dog",
    exampleHighlight: "d",
    tip: "Tongue tip behind upper teeth, voice",
  },
  {
    symbol: "k",
    type: "consonant",
    subtype: "plosive",
    voiced: false,
    exampleWord: "cat",
    exampleHighlight: "c",
    tip: "Back of tongue to soft palate",
  },
  {
    symbol: "ɡ",
    type: "consonant",
    subtype: "plosive",
    voiced: true,
    exampleWord: "go",
    exampleHighlight: "g",
    tip: "Back of tongue to soft palate, voice",
  },

  // Fricatives
  {
    symbol: "f",
    type: "consonant",
    subtype: "fricative",
    voiced: false,
    exampleWord: "fish",
    exampleHighlight: "f",
    tip: "Lower lip under upper teeth",
  },
  {
    symbol: "v",
    type: "consonant",
    subtype: "fricative",
    voiced: true,
    exampleWord: "van",
    exampleHighlight: "v",
    tip: "Lower lip under upper teeth, voice",
  },
  {
    symbol: "θ",
    type: "consonant",
    subtype: "fricative",
    voiced: false,
    exampleWord: "think",
    exampleHighlight: "th",
    tip: "Tongue between teeth, blow air",
  },
  {
    symbol: "ð",
    type: "consonant",
    subtype: "fricative",
    voiced: true,
    exampleWord: "this",
    exampleHighlight: "th",
    tip: "Tongue between teeth, vibrate",
  },
  {
    symbol: "s",
    type: "consonant",
    subtype: "fricative",
    voiced: false,
    exampleWord: "see",
    exampleHighlight: "s",
    tip: "Tongue behind upper teeth, hiss",
  },
  {
    symbol: "z",
    type: "consonant",
    subtype: "fricative",
    voiced: true,
    exampleWord: "zoo",
    exampleHighlight: "z",
    tip: "Tongue behind upper teeth, buzz",
  },
  {
    symbol: "ʃ",
    type: "consonant",
    subtype: "fricative",
    voiced: false,
    exampleWord: "she",
    exampleHighlight: "sh",
    tip: "Tongue pulled back, lips rounded",
  },
  {
    symbol: "ʒ",
    type: "consonant",
    subtype: "fricative",
    voiced: true,
    exampleWord: "measure",
    exampleHighlight: "s",
    tip: "Like /ʃ/ but with voice",
  },
  {
    symbol: "h",
    type: "consonant",
    subtype: "fricative",
    voiced: false,
    exampleWord: "hat",
    exampleHighlight: "h",
    tip: "Open mouth, push air from throat",
  },

  // Affricates
  {
    symbol: "tʃ",
    type: "consonant",
    subtype: "affricate",
    voiced: false,
    exampleWord: "church",
    exampleHighlight: "ch",
    tip: "Combine /t/ + /ʃ/ together",
  },
  {
    symbol: "dʒ",
    type: "consonant",
    subtype: "affricate",
    voiced: true,
    exampleWord: "judge",
    exampleHighlight: "j",
    tip: "Combine /d/ + /ʒ/ together",
  },

  // Nasals
  {
    symbol: "m",
    type: "consonant",
    subtype: "nasal",
    voiced: true,
    exampleWord: "man",
    exampleHighlight: "m",
    tip: "Close lips, air through nose",
  },
  {
    symbol: "n",
    type: "consonant",
    subtype: "nasal",
    voiced: true,
    exampleWord: "no",
    exampleHighlight: "n",
    tip: "Tongue tip behind teeth, air through nose",
  },
  {
    symbol: "ŋ",
    type: "consonant",
    subtype: "nasal",
    voiced: true,
    exampleWord: "sing",
    exampleHighlight: "ng",
    tip: "Back of tongue to palate, air through nose",
  },

  // Lateral
  {
    symbol: "l",
    type: "consonant",
    subtype: "lateral",
    voiced: true,
    exampleWord: "leg",
    exampleHighlight: "l",
    tip: "Tongue tip behind teeth, air around sides",
  },

  // Approximants
  {
    symbol: "r",
    type: "consonant",
    subtype: "approximant",
    voiced: true,
    exampleWord: "red",
    exampleHighlight: "r",
    tip: "Tongue curled back, no contact",
  },
  {
    symbol: "j",
    type: "consonant",
    subtype: "approximant",
    voiced: true,
    exampleWord: "yes",
    exampleHighlight: "y",
    tip: "Tongue near palate, like long /iː/",
  },
  {
    symbol: "w",
    type: "consonant",
    subtype: "approximant",
    voiced: true,
    exampleWord: "wet",
    exampleHighlight: "w",
    tip: "Rounded lips, like quick /uː/",
  },
];

// ── Vowels (20 phonemes) ──

export const VOWELS: IpaPhoneme[] = [
  // Monophthongs — Short
  {
    symbol: "ɪ",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "sit",
    exampleHighlight: "i",
    tip: "Short, relaxed — between 'ee' and 'eh'",
  },
  {
    symbol: "e",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "bed",
    exampleHighlight: "e",
    tip: "Mid-front, mouth half open",
  },
  {
    symbol: "æ",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "cat",
    exampleHighlight: "a",
    tip: "Wide open mouth, tongue low-front",
  },
  {
    symbol: "ʌ",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "cup",
    exampleHighlight: "u",
    tip: "Short, central, mouth barely open",
  },
  {
    symbol: "ʊ",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "put",
    exampleHighlight: "u",
    tip: "Short, lips slightly rounded",
  },
  {
    symbol: "ə",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "about",
    exampleHighlight: "a",
    tip: "Schwa — the laziest vowel, unstressed",
  },
  {
    symbol: "ɒ",
    type: "vowel",
    subtype: "monophthong-short",
    voiced: true,
    exampleWord: "hot",
    exampleHighlight: "o",
    tip: "Short, rounded lips, back of tongue low (British)",
  },

  // Monophthongs — Long
  {
    symbol: "iː",
    type: "vowel",
    subtype: "monophthong-long",
    voiced: true,
    exampleWord: "see",
    exampleHighlight: "ee",
    tip: "Long, tongue high-front, spread lips",
  },
  {
    symbol: "ɑː",
    type: "vowel",
    subtype: "monophthong-long",
    voiced: true,
    exampleWord: "father",
    exampleHighlight: "a",
    tip: "Long, mouth wide open, tongue low-back",
  },
  {
    symbol: "ɔː",
    type: "vowel",
    subtype: "monophthong-long",
    voiced: true,
    exampleWord: "saw",
    exampleHighlight: "aw",
    tip: "Long, rounded lips, jaw drops",
  },
  {
    symbol: "uː",
    type: "vowel",
    subtype: "monophthong-long",
    voiced: true,
    exampleWord: "food",
    exampleHighlight: "oo",
    tip: "Long, lips tightly rounded, tongue high-back",
  },
  {
    symbol: "ɜː",
    type: "vowel",
    subtype: "monophthong-long",
    voiced: true,
    exampleWord: "bird",
    exampleHighlight: "ir",
    tip: "Long, central, lips slightly spread",
  },

  // Diphthongs
  {
    symbol: "eɪ",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "day",
    exampleHighlight: "ay",
    tip: "Glide from /e/ toward /ɪ/",
  },
  {
    symbol: "aɪ",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "my",
    exampleHighlight: "y",
    tip: "Glide from open /a/ toward /ɪ/",
  },
  {
    symbol: "ɔɪ",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "boy",
    exampleHighlight: "oy",
    tip: "Glide from /ɔ/ toward /ɪ/",
  },
  {
    symbol: "aʊ",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "how",
    exampleHighlight: "ow",
    tip: "Glide from open /a/ toward /ʊ/",
  },
  {
    symbol: "əʊ",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "go",
    exampleHighlight: "o",
    tip: "Glide from /ə/ toward /ʊ/ (British: 'gəʊ')",
  },
  {
    symbol: "ɪə",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "near",
    exampleHighlight: "ear",
    tip: "Glide from /ɪ/ toward /ə/",
  },
  {
    symbol: "eə",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "hair",
    exampleHighlight: "air",
    tip: "Glide from /e/ toward /ə/",
  },
  {
    symbol: "ʊə",
    type: "vowel",
    subtype: "diphthong",
    voiced: true,
    exampleWord: "pure",
    exampleHighlight: "ure",
    tip: "Glide from /ʊ/ toward /ə/",
  },
];

// Subtype labels for UI grouping
export const CONSONANT_SUBTYPE_LABELS: Record<ConsonantSubtype, string> = {
  plosive: "Plosives (Âm tắc)",
  fricative: "Fricatives (Âm xát)",
  affricate: "Affricates (Âm tắc xát)",
  nasal: "Nasals (Âm mũi)",
  lateral: "Lateral (Âm bên)",
  approximant: "Approximants (Âm tiếp cận)",
};

export const VOWEL_SUBTYPE_LABELS: Record<VowelSubtype, string> = {
  "monophthong-short": "Short Vowels (Nguyên âm ngắn)",
  "monophthong-long": "Long Vowels (Nguyên âm dài)",
  diphthong: "Diphthongs (Nguyên âm đôi)",
};
