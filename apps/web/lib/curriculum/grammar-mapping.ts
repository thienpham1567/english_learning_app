/**
 * Maps grammar topic IDs to the roadmap week where they're taught.
 * This enables cross-linking between Grammar Lessons → Roadmap.
 */

export const GRAMMAR_TOPIC_TO_WEEK: Record<string, { weekNumber: number; day: string }> = {
  // Week 1: Simple Present & Past
  "present-simple": { weekNumber: 1, day: "mon" },
  "past-simple": { weekNumber: 1, day: "mon" },

  // Week 2: Perfect & Continuous
  "present-perfect": { weekNumber: 2, day: "mon" },
  "past-perfect": { weekNumber: 2, day: "mon" },
  "present-continuous": { weekNumber: 2, day: "mon" },
  "past-continuous": { weekNumber: 2, day: "mon" },
  "future-will-going": { weekNumber: 2, day: "mon" },

  // Week 3: Parts of Speech
  "pos-noun-adj-adv": { weekNumber: 3, day: "mon" },
  "pos-suffixes": { weekNumber: 3, day: "mon" },
  "pos-word-form-selection": { weekNumber: 3, day: "mon" },
  "pos-compound-nouns": { weekNumber: 3, day: "mon" },

  // Week 4: Determiners & Pronouns
  "articles": { weekNumber: 4, day: "mon" },
  "quantifiers": { weekNumber: 4, day: "mon" },
  "both-either-neither": { weekNumber: 4, day: "mon" },
  "pron-personal-possessive": { weekNumber: 4, day: "mon" },
  "pron-reflexive": { weekNumber: 4, day: "mon" },
  "pron-agreement": { weekNumber: 4, day: "mon" },

  // Week 7: Prepositions
  "prep-time": { weekNumber: 7, day: "mon" },
  "prep-place-direction": { weekNumber: 7, day: "mon" },
  "prep-collocations": { weekNumber: 7, day: "mon" },
  "prep-phrasal-verbs": { weekNumber: 7, day: "mon" },
  "prep-adj-collocations": { weekNumber: 7, day: "mon" },

  // Week 8: Conjunctions
  "conj-coordinating": { weekNumber: 8, day: "mon" },
  "conj-subordinating": { weekNumber: 8, day: "mon" },
  "conj-transitions": { weekNumber: 8, day: "mon" },
  "conj-paired": { weekNumber: 8, day: "mon" },

  // Week 9: Conditionals & Passive
  "zero-first": { weekNumber: 9, day: "mon" },
  "second-conditional": { weekNumber: 9, day: "mon" },
  "third-conditional": { weekNumber: 9, day: "mon" },
  "passive-simple": { weekNumber: 9, day: "mon" },
  "passive-perfect": { weekNumber: 9, day: "mon" },
  "causative": { weekNumber: 9, day: "mon" },
  "passive-modals": { weekNumber: 9, day: "mon" },

  // Week 10: Gerunds, Infinitives & Participles
  "gi-verb-gerund": { weekNumber: 10, day: "mon" },
  "gi-verb-infinitive": { weekNumber: 10, day: "mon" },
  "gi-both": { weekNumber: 10, day: "mon" },

  // Advanced
  "sva-basic": { weekNumber: 3, day: "tue" },
  "sva-collective": { weekNumber: 3, day: "tue" },
  "sva-indefinite": { weekNumber: 3, day: "tue" },
  "sva-prepositional-traps": { weekNumber: 3, day: "tue" },

  "can-could-may": { weekNumber: 4, day: "tue" },
  "must-have-to": { weekNumber: 4, day: "tue" },
  "should-ought": { weekNumber: 4, day: "tue" },

  "comp-er-est": { weekNumber: 5, day: "thu" },
  "comp-as-as": { weekNumber: 5, day: "thu" },
  "comp-irregular": { weekNumber: 5, day: "thu" },

  "relative-who-which": { weekNumber: 10, day: "tue" },
  "relative-advanced": { weekNumber: 10, day: "tue" },
  "noun-clauses": { weekNumber: 10, day: "tue" },
  "relative-reduced": { weekNumber: 10, day: "tue" },
};

/**
 * Get the roadmap week range for a grammar category
 */
export function getCategoryRoadmapWeeks(topicIds: string[]): number[] {
  const weeks = new Set<number>();
  for (const id of topicIds) {
    const mapping = GRAMMAR_TOPIC_TO_WEEK[id];
    if (mapping) weeks.add(mapping.weekNumber);
  }
  return [...weeks].sort((a, b) => a - b);
}

/**
 * Get the roadmap unit ID for a grammar topic.
 * Returns the unit ID string (e.g. "w1-mon-0") that should be auto-completed
 * when the user finishes the grammar lesson for this topic.
 */
export function getUnitIdForGrammarTopic(topicId: string): string | null {
  const mapping = GRAMMAR_TOPIC_TO_WEEK[topicId];
  if (!mapping) return null;
  // Unit IDs are `w{weekNumber}-{day}-{idx}`, grammar theory is always idx 0
  return `w${mapping.weekNumber}-${mapping.day}-0`;
}
