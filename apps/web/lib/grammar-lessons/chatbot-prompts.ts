/**
 * Per-topic prompts that seed an English-chatbot practice session from a
 * grammar lesson. Each grammar topic has a tailored "focus" string describing
 * what to drill and the single most common trap for that point; the focus is
 * composed into a full coaching prompt by {@link buildGrammarChatbotPrompt}.
 *
 * The composed prompt is sent to the chatbot (persona "Aria") as the learner's
 * first message, so it deliberately asks for the app's auto-graded `toeic`
 * block format and interactive, one-set-at-a-time pacing.
 */

/**
 * topicId → focus line. The focus names the exact sub-skill and the #1 mistake
 * Vietnamese learners make on that point, so the tutor drills the right thing.
 * Keys match the topic ids in {@link ./topics.ts}.
 */
export const GRAMMAR_CHATBOT_FOCUS: Record<string, string> = {
  // ── Tenses ──
  "present-simple":
    "Habits, facts and schedules; the third-person -s ending (he work → he works) and do/does in questions and negatives.",
  "present-continuous":
    "Actions happening now vs. fixed states; spelling of -ing forms and why stative verbs (know, want, like) usually avoid the continuous.",
  "present-perfect":
    "have/has + V3 for experience and unfinished time; present perfect vs. past simple, and the difference between for and since.",
  "past-simple":
    "Finished actions with a definite time; regular -ed vs. irregular verbs, and did + base form in questions and negatives.",
  "past-continuous":
    "An action in progress in the past interrupted by a shorter past-simple action (was doing … when … did); when vs. while.",
  "past-perfect":
    "had + V3 for the earlier of two past actions; sequencing with after/before/by the time and contrast with the past simple.",
  "future-will-going":
    "will for spontaneous decisions and predictions vs. be going to for plans and present evidence; future time clauses that take the present tense.",
  "future-perfect":
    "will have + V3 for an action completed before a future point; signal phrases like by + future time and by the time.",

  // ── Subject–Verb Agreement ──
  "sva-basic":
    "Matching singular/plural subjects to verbs; tricky nouns (news, information, advice) and how there is/there are agrees with what follows.",
  "sva-collective":
    "Collective nouns (team, company, staff, committee) treated as one unit (singular) vs. as members (plural) and keeping it consistent.",
  "sva-indefinite":
    "Indefinite pronouns that look plural but are singular (everyone, each, either, neither, somebody) and always take a singular verb.",
  "sva-prepositional-traps":
    "Ignoring the prepositional phrase between subject and verb (the box of books IS …); agreeing with the real head noun, not the nearest noun.",

  // ── Parts of Speech ──
  "pos-noun-adj-adv":
    "Choosing noun vs. adjective vs. adverb by sentence slot; adjectives before nouns, adverbs modifying verbs/adjectives.",
  "pos-suffixes":
    "Reading word endings to identify part of speech (-tion/-ment = noun, -ous/-al = adjective, -ly = adverb, -ize = verb).",
  "pos-word-form-selection":
    "Part 5 word-form questions where the four options are the same root in different forms; pick the form the grammar slot requires.",
  "pos-compound-nouns":
    "Noun + noun combinations (sales report, budget plan, customer service) where the first noun stays singular and acts like a modifier.",
  participles:
    "Present participle (-ing, active/causing the feeling) vs. past participle (-ed, passive/receiving it): interesting vs. interested.",

  // ── Modals ──
  "can-could-may":
    "Ability, permission and polite requests; could and may as softer/more formal than can, and could for past ability.",
  "must-have-to":
    "Obligation with must (speaker's authority) vs. have to (external rule); and the key contrast mustn't (prohibition) vs. don't have to (no obligation).",
  "should-ought":
    "Advice and recommendation with should / ought to; should + have + V3 for past regret or criticism.",
  subjunctive:
    "Base-form verb after suggest/recommend/insist/demand that … (We suggest that he GO, not goes) and after it is essential/important that …",

  // ── Prepositions ──
  "prep-time":
    "in (months, years, parts of day), on (days, dates), at (clock times, night) — and the fixed pairs learners mix up most.",
  "prep-place-direction":
    "in / on / at for position vs. to / into / onto for movement; common location phrases (at the office, in the building, on the floor).",
  "prep-collocations":
    "Fixed verb + preposition pairs (depend ON, consist OF, apply FOR, result IN) that must be memorized as units.",
  "prep-phrasal-verbs":
    "Common business phrasal verbs (set up, carry out, look into, follow up) and separable vs. inseparable patterns.",
  "prep-adj-collocations":
    "Fixed adjective + preposition pairs (responsible FOR, interested IN, capable OF, similar TO) that TOEIC Part 5 tests directly.",

  // ── Conjunctions ──
  "conj-coordinating":
    "Joining equal ideas with and/but/or/so/yet and the comma rule when linking two full clauses.",
  "conj-subordinating":
    "although/because/while/if introducing a dependent clause; meaning relationships and comma placement when the clause comes first.",
  "conj-transitions":
    "Transition adverbs (however, therefore, moreover, nevertheless) that connect ideas across sentences and need a semicolon or new sentence, not a comma.",
  "conj-paired":
    "Correlative pairs (not only … but also, either … or, neither … nor, both … and) kept balanced, with the right verb agreement.",
  "conj-vs-prep":
    "The classic trap: conjunction + clause vs. preposition + noun — because vs. because of, although vs. despite, while vs. during.",
  "parallel-structure":
    "Keeping items in a list or after correlatives in the same grammatical form (to run, to swim, and to cycle — not …and cycling).",

  // ── Conditionals ──
  "zero-first":
    "Zero (if + present, present — general truths) vs. first (if + present, will + base — real future possibility); no will in the if-clause.",
  "second-conditional":
    "Unreal/hypothetical present: if + past simple, would + base; the fixed If I were you … for advice.",
  "third-conditional":
    "Unreal past regret: if + past perfect, would have + V3; talking about how things could have been different.",
  "mixed-conditional":
    "Mixing time frames: past condition with present result (If I had studied, I would be …) and vice versa.",

  // ── Comparatives & Superlatives ──
  "comp-er-est":
    "-er/-est for short adjectives vs. more/most for longer ones; the than after comparatives and the before superlatives.",
  "comp-as-as":
    "Equality with as + adjective + as and inequality with not as … as; the than vs. as trap.",
  "comp-irregular":
    "Irregular forms good→better→best, bad→worse→worst, far→further/farther and little/much comparisons.",

  // ── Gerunds & Infinitives ──
  "gi-verb-gerund":
    "Verbs always followed by -ing (enjoy, avoid, suggest, mind, finish, consider) and gerunds after prepositions.",
  "gi-verb-infinitive":
    "Verbs followed by to + base (decide, want, hope, agree, plan, manage, refuse) and adjective + to-infinitive patterns.",
  "gi-both":
    "Verbs that take both forms with a meaning change: remember/forget/stop/try/regret doing vs. to do.",

  // ── Passive Voice ──
  "passive-simple":
    "be + V3 across simple tenses; turning the object into the subject, when to keep by …, and why the past participle never changes.",
  "passive-perfect":
    "Perfect passives have/had been + V3 (The report has been submitted) and tense matching with the active sentence.",
  causative:
    "have/get + something + V3 for arranging a service (I had my car repaired) vs. doing it yourself.",
  "passive-modals":
    "Modal + be + V3 (should be done, must be completed, can be found); a frequent Part 5 structure.",

  // ── Pronouns ──
  "pron-personal-possessive":
    "Subject vs. object pronouns (I/me, he/him), possessive adjectives vs. pronouns (my/mine, your/yours) and its vs. it's.",
  "pron-reflexive":
    "Reflexive pronouns (myself, themselves) when subject and object are the same person, and by myself = alone.",
  "pron-agreement":
    "Matching a pronoun to its antecedent in number and gender (each employee … his or her, the companies … their).",

  // ── Clauses ──
  "relative-who-which":
    "Defining relative clauses with who (people), which (things), that (both); when the relative pronoun can be omitted.",
  "relative-advanced":
    "Non-defining clauses set off by commas (adding extra info), where that is not allowed and which/who is required.",
  "noun-clauses":
    "Clauses acting as subject/object, especially that-clauses and wh-/whether/if clauses (I don't know whether he will come).",
  "relative-reduced":
    "Shortening relative clauses to participle phrases: the man who is waiting → the man waiting; reports which were submitted → reports submitted.",

  // ── Determiners ──
  articles:
    "a/an (first mention, countable singular) vs. the (specific/known) vs. zero article (general plurals and uncountables).",
  quantifiers:
    "some vs. any, much (uncountable) vs. many (countable), a few/a little vs. few/little and their nuance.",
  "both-either-neither":
    "both (two together, plural verb), either/neither (one of two, singular verb) and the either … or / neither … nor pairs.",

  // ── Inversion (TOEIC) ──
  "inversion-toeic":
    "Negative-adverb fronting that inverts subject and auxiliary (Never has …, Rarely do …, Not only …, Under no circumstances …).",

  // ── Part 6 skills ──
  "sentence-insertion":
    "Choosing the sentence that best fits a blank in a passage by tracking cohesion — pronouns, transition words and logical flow.",

  // ── Speech forms ──
  "reported-speech":
    "Backshifting tenses and changing pronouns/time words when reporting what someone said (says → said, will → would, tomorrow → the next day).",
  "tag-questions":
    "Forming the short question tag with the matching auxiliary and opposite polarity (You're coming, aren't you? / She didn't call, did she?).",

  // ── Complex Sentences (IELTS) ──
  "cs-adverbial":
    "Adverbial clauses of time, reason, contrast and purpose (because, although, so that, whereas) for higher-band complexity.",
  "cs-multiple-clause":
    "Combining several clauses smoothly into one well-punctuated sentence without run-ons or fragments.",
  "cs-participle":
    "Participle clauses to add information concisely (Having finished the test, she …; Walking home, I saw …) and avoiding dangling participles.",

  // ── Inversion & Emphasis (IELTS) ──
  "inv-negative-adverb":
    "Inversion after negative adverbials for emphasis (Never have I …, Not until … did …, Hardly had I … when …).",
  "inv-cleft":
    "Cleft sentences for emphasis: It was X that … and What I need is … to highlight a particular element.",
  "inv-fronting":
    "Fronting and emphatic word order (So beautiful was the view that …; Only then did he realize …).",

  // ── Nominalization (IELTS) ──
  "nom-verb-to-noun":
    "Turning verbs/adjectives into nouns for an academic style (discover → discovery, decide → decision, able → ability).",
  "nom-academic-register":
    "Rewriting informal, verb-heavy sentences into formal, noun-based academic register suitable for IELTS Writing Task 2.",

  // ── Advanced Structures (IELTS) ──
  "adv-subjunctive":
    "Base-form subjunctive after suggest/recommend/demand/insist that … and in fixed phrases (be it …, lest …).",
  "adv-wish-if-only":
    "wish / if only for regret and unreal situations (wish + past simple = present, wish + past perfect = past, wish + would = annoyance).",
  "adv-hedging":
    "Cautious academic language (tends to, is likely to, may, appears to, in general) to soften claims in IELTS Writing.",
};

/**
 * Builds the full chatbot practice prompt for a grammar topic. Falls back to a
 * generic focus line when the topic id is unknown so any new topic still works.
 */
export function buildGrammarChatbotPrompt(topicId: string, topicTitle: string): string {
  const focus =
    GRAMMAR_CHATBOT_FOCUS[topicId] ??
    `The core rules of ${topicTitle} and the mistakes learners most commonly make with it.`;

  return [
    `I want to practice **${topicTitle}** for the TOEIC. Be my grammar coach for this one point only.`,
    "",
    `Focus: ${focus}`,
    "",
    "Please:",
    "1. Give me a 2–3 sentence refresher on the core rule and the single most common mistake.",
    `2. Drill me with 5 TOEIC Part 5–style questions in a \`toeic\` block, ordered easy → hard, every question testing **${topicTitle}**.`,
    "3. Wait for my answers, then correct me inline and explain why each wrong option is wrong.",
    "4. Finish with 2 fill-in-the-blank questions where I have to produce the form myself.",
    "",
    "Keep it interactive — give me one set at a time and wait for my response.",
  ].join("\n");
}
