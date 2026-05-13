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

/**
 * Normalize an LLM-parsed JSON response into `{ exercises: [...] }`.
 *
 * Gemini Flash Lite frequently returns the exercises array under
 * a non-standard key (e.g. "quiz", "questions", "challenge", "data")
 * or nests it one level deeper. This function searches the parsed
 * JSON for an array of objects that look like exercises (have a
 * `type` field matching known types) and wraps them in the expected shape.
 */
export function normalizeChallenge(
  obj: Record<string, unknown>,
): { exercises: unknown[] } | null {
  // Fast path: already has `exercises` as an array
  if (Array.isArray(obj.exercises) && obj.exercises.length > 0) {
    return obj as { exercises: unknown[] };
  }

  // Search all top-level values for an array that looks like exercises
  for (const value of Object.values(obj)) {
    if (isExerciseArray(value)) {
      return { exercises: value as unknown[] };
    }
    // One level deeper: value is an object containing the array
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (isExerciseArray(nested)) {
          return { exercises: nested as unknown[] };
        }
      }
    }
  }

  return null;
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
