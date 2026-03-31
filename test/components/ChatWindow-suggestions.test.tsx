import { describe, it, expect } from "vitest";
import { PERSONAS } from "@/lib/chat/personas";
import { sampleSuggestions } from "@/components/app/ChatWindow";

describe("sampleSuggestions", () => {
  it("returns exactly `count` items", () => {
    const result = sampleSuggestions(PERSONAS[0], 4);
    expect(result).toHaveLength(4);
  });

  it("returns items from the persona's suggestions pool", () => {
    const persona = PERSONAS[0];
    const result = sampleSuggestions(persona, 4);
    for (const item of result) {
      expect(persona.suggestions.some((s) => s.text === item.text)).toBe(true);
    }
  });

  it("returns all items when count >= pool size", () => {
    const persona = PERSONAS[0];
    const result = sampleSuggestions(persona, persona.suggestions.length + 5);
    expect(result).toHaveLength(persona.suggestions.length);
  });

  it("returns no duplicates", () => {
    const result = sampleSuggestions(PERSONAS[0], 4);
    const texts = result.map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});
