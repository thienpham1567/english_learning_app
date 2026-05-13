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
 * Normalize an LLM-parsed JSON response into `{ exercises: [...] }`.
 *
 * Handles two classes of structural mismatch from Gemini Flash Lite:
 *
 * 1. **Wrong wrapper key** — The exercises array lives under a key other
 *    than `"exercises"` (e.g. `"quiz"`, `"questions"`, `"data"`).
 *
 * 2. **Flat exercise objects** — The model omits the `data` wrapper and
 *    places content fields (sentence, options, correctIndex, …) directly
 *    on the exercise object instead of nesting them inside `data`.
 */
export function normalizeChallenge(
  obj: Record<string, unknown>,
): { exercises: unknown[] } | null {
  // ── Step 1: locate the exercises array ──
  let exercises: unknown[] | null = null;

  if (Array.isArray(obj.exercises) && obj.exercises.length > 0) {
    exercises = obj.exercises;
  }

  if (!exercises) {
    // Search all top-level values for an array that looks like exercises
    for (const value of Object.values(obj)) {
      if (isExerciseArray(value)) {
        exercises = value as unknown[];
        break;
      }
      // One level deeper: value is an object containing the array
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

  // ── Step 2: normalize each exercise (wrap flat fields into `data`) ──
  const normalized = exercises.map((ex) => normalizeExercise(ex));

  return { exercises: normalized };
}

/**
 * If an exercise has its content fields at the top level instead of
 * nested inside a `data` object, wrap them.
 *
 * Example input:
 *   { type: "fill-in-blank", instruction: "...", sentence: "...", options: [...], correctIndex: 1 }
 *
 * Normalized output:
 *   { type: "fill-in-blank", instruction: "...", data: { sentence: "...", options: [...], correctIndex: 1 } }
 */
function normalizeExercise(ex: unknown): unknown {
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) return ex;

  const obj = ex as Record<string, unknown>;

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
  return val.some(
    (item) =>
      item &&
      typeof item === "object" &&
      "type" in item &&
      typeof (item as Record<string, unknown>).type === "string" &&
      KNOWN_EXERCISE_TYPES.has(
        (item as Record<string, unknown>).type as string,
      ),
  );
}
