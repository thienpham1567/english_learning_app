import { ExerciseSchema } from "@/lib/daily-challenge/schema";
import type { z } from "zod";

const KNOWN_EXERCISE_TYPES = new Set([
  "fill-in-blank",
  "sentence-order",
  "translation",
  "error-correction",
  "word-formation",
  "dialogue-completion",
  "synonym-antonym",
  "reading-comprehension",
  "collocation",
]);

/** Reserved top-level keys that should NOT be folded into `data`. */
const RESERVED_KEYS = new Set(["type", "instruction"]);

/**
 * Common type name variations the model uses → canonical type names.
 */
const TYPE_ALIASES: Record<string, string> = {
  "fill-in-the-blank": "fill-in-blank",
  "fill_in_blank": "fill-in-blank",
  "fill_in_the_blank": "fill-in-blank",
  "gap-fill": "fill-in-blank",
  "multiple-choice": "fill-in-blank",
  "sentence-ordering": "sentence-order",
  "sentence_order": "sentence-order",
  "word-order": "sentence-order",
  "translate": "translation",
  "error-detection": "error-correction",
  "error_correction": "error-correction",
  "word_formation": "word-formation",
  "word-form": "word-formation",
  "dialogue_completion": "dialogue-completion",
  "conversation-completion": "dialogue-completion",
  "synonym_antonym": "synonym-antonym",
  "synonyms-antonyms": "synonym-antonym",
  "synonym": "synonym-antonym",
  "antonym": "synonym-antonym",
  "reading_comprehension": "reading-comprehension",
  "reading": "reading-comprehension",
  "collocation_exercise": "collocation",
};

export type ValidExercise = z.infer<typeof ExerciseSchema>;

/**
 * Normalize an LLM-parsed JSON response into `{ exercises: [...] }`.
 *
 * Handles three classes of structural mismatch from Gemini Flash Lite:
 *
 * 1. **Wrong wrapper key** — The exercises array lives under a key other
 *    than `"exercises"` (e.g. `"quiz"`, `"questions"`, `"data"`).
 *
 * 2. **Flat exercise objects** — The model omits the `data` wrapper and
 *    places content fields (sentence, options, correctIndex, …) directly
 *    on the exercise object instead of nesting them inside `data`.
 *
 * 3. **Partial validity** — Some exercises in the batch are valid while
 *    others have malformed types or missing fields. This function
 *    validates each exercise individually and keeps the valid ones.
 */
export function normalizeChallenge(
  obj: Record<string, unknown>,
  minExercises = 3,
): { exercises: ValidExercise[]; dropped: number } | null {
  // ── Step 1: locate the exercises array ──
  let exercises: unknown[] | null = null;

  if (Array.isArray(obj.exercises) && obj.exercises.length > 0) {
    exercises = obj.exercises;
  }

  if (!exercises) {
    for (const value of Object.values(obj)) {
      if (isExerciseArray(value)) {
        exercises = value as unknown[];
        break;
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const nested of Object.values(value as Record<string, unknown>)) {
          if (isExerciseArray(nested)) {
            exercises = nested as unknown[];
            break;
          }
        }
        if (exercises) break;
      }
    }
  }

  if (!exercises) return null;

  // ── Step 2: normalize each exercise ──
  const normalized = exercises.map((ex) => normalizeExercise(ex));

  // ── Step 3: validate individually, keep the good ones ──
  const valid: ValidExercise[] = [];
  for (const ex of normalized) {
    const result = ExerciseSchema.safeParse(ex);
    if (result.success) {
      valid.push(result.data);
    }
  }

  if (valid.length < minExercises) return null;

  return { exercises: valid, dropped: normalized.length - valid.length };
}

/**
 * If an exercise has its content fields at the top level instead of
 * nested inside a `data` object, wrap them. Also normalizes type aliases.
 */
function normalizeExercise(ex: unknown): unknown {
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) return ex;

  const obj = ex as Record<string, unknown>;

  // Normalize type aliases (e.g. "fill-in-the-blank" → "fill-in-blank")
  if (typeof obj.type === "string") {
    const canonical = TYPE_ALIASES[obj.type];
    if (canonical) {
      obj.type = canonical;
    }
  }

  // Already has a `data` object — leave it alone
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj;
  }

  // Collect all non-reserved keys into a `data` wrapper
  const data: Record<string, unknown> = {};
  const shell: Record<string, unknown> = {};
  let hasDataFields = false;

  for (const [key, value] of Object.entries(obj)) {
    if (RESERVED_KEYS.has(key)) {
      shell[key] = value;
    } else {
      data[key] = value;
      hasDataFields = true;
    }
  }

  if (!hasDataFields) return obj;

  return { ...shell, data };
}

function isExerciseArray(val: unknown): boolean {
  if (!Array.isArray(val) || val.length === 0) return false;
  // More lenient: just check for objects with a string `type` field
  return val.some(
    (item) =>
      item &&
      typeof item === "object" &&
      "type" in item &&
      typeof (item as Record<string, unknown>).type === "string",
  );
}
