/**
 * Robustly extract a JSON object from an LLM response that may contain
 * markdown fences, trailing commentary, or other non-JSON noise.
 *
 * Gemini models via OpenRouter sometimes ignore `response_format: json_object`
 * and wrap JSON in ```json ``` fences or append trailing text after the closing brace.
 */
export function extractJson(raw: string): unknown {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  // Find the outermost { ... } by tracking brace depth
  const start = cleaned.indexOf("{");
  if (start === -1) throw new SyntaxError("No JSON object found in response");

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) throw new SyntaxError("Unbalanced braces in JSON response");

  return JSON.parse(cleaned.slice(start, end + 1));
}
