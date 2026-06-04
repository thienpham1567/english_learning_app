/**
 * Shared prompt building blocks.
 *
 * These constants replace the slightly-different copies of the same rules that
 * were hand-written across ~30 prompts. Compose them into a system prompt with
 * `joinPrompt(...)`. Keeping one canonical wording makes model behaviour
 * consistent and lets us tune output discipline in a single place.
 */

/** Output must be JSON only — no fences, no prose, no markdown. */
export const JSON_ONLY_RULE =
  "Return valid JSON that exactly matches the provided schema. Do not add, rename, or omit fields. Do not include markdown, HTML, code fences, or commentary anywhere in the output.";

/** `**bold**` is the only inline markup, and only where explicitly told. */
export const BOLD_ONLY_RULE =
  "The only formatting allowed inside string values is `**bold**` (double asterisks) where this prompt explicitly tells you to use it. Do not use single asterisks, underscores, backticks, or any other markup.";

/** Vietnamese strings must read naturally, not be word-by-word translations. */
export const VIETNAMESE_NATURALNESS_RULE =
  "All Vietnamese text must read naturally to a Vietnamese speaker. Do not translate word-by-word, do not Anglicise word order, and do not invent loanwords. Prefer the phrasing a Vietnamese learner would actually say or write.";

/** Build a closing self-check line from a list of checks. */
export function selfCheck(checks: string[]): string {
  return `Before responding, verify: ${checks.join("; ")}.`;
}

/** Join prompt segments into a newline-separated system prompt, dropping empties. */
export function joinPrompt(...segments: Array<string | false | null | undefined>): string {
  return segments.filter((s): s is string => Boolean(s && s.trim())).join("\n");
}

/**
 * Canonical temperatures by task intent. Use these instead of ad-hoc literals so
 * the spread of values across the codebase stays principled.
 *   - grading: deterministic scoring/analysis (low variance wanted)
 *   - analysis: explanations, classification, extraction
 *   - generation: exercises, content, examples (some variety wanted)
 *   - creative: brainstorming topics, varied phrasing (high variety)
 */
export const PROMPT_TEMPERATURE = {
  grading: 0.2,
  analysis: 0.4,
  generation: 0.7,
  creative: 0.9,
} as const;

export type PromptTaskKind = keyof typeof PROMPT_TEMPERATURE;
