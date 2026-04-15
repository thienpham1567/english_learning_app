import { describe, expect, it } from "vitest";
import { findPersona, PERSONA_IDS, PERSONAS } from "@/lib/chat/personas";

describe("PERSONAS", () => {
  it("exports exactly 3 personas", () => {
    expect(PERSONAS).toHaveLength(3);
  });

  it("has simon as the first persona", () => {
    expect(PERSONAS[0].id).toBe("simon");
  });

  it("PERSONA_IDS contains simon, christine, eddie in order", () => {
    expect(PERSONA_IDS).toEqual(["simon", "christine", "eddie"]);
  });
});

describe("findPersona", () => {
  it("returns simon persona for 'simon'", () => {
    const p = findPersona("simon");
    expect(p.id).toBe("simon");
    expect(p.label).toBe("Simon Hosking — Native Fluency");
  });

  it("returns christine persona for 'christine'", () => {
    const p = findPersona("christine");
    expect(p.id).toBe("christine");
    expect(p.label).toBe("Christine Ho — IELTS Master");
  });

  it("returns eddie persona for 'eddie'", () => {
    const p = findPersona("eddie");
    expect(p.id).toBe("eddie");
    expect(p.label).toBe("Eddie Oliver — TOEIC Master");
  });

  it("falls back to simon for unknown id", () => {
    expect(findPersona("unknown").id).toBe("simon");
  });
});

describe("persona buildInstructions", () => {
  it("simon: contains native fluency focus", () => {
    const instructions = findPersona("simon").buildInstructions({ consecutiveVietnameseTurns: 0 });
    expect(instructions).toContain("Simon Hosking");
    expect(instructions).toContain("idioms");
  });

  it("christine: contains IELTS rubric reference", () => {
    const instructions = findPersona("christine").buildInstructions({
      consecutiveVietnameseTurns: 0,
    });
    expect(instructions).toContain("Christine Ho");
    expect(instructions).toContain("IELTS");
    expect(instructions).toContain("Task Response");
  });

  it("eddie: contains TOEIC and business focus", () => {
    const instructions = findPersona("eddie").buildInstructions({ consecutiveVietnameseTurns: 0 });
    expect(instructions).toContain("Eddie Oliver");
    expect(instructions).toContain("TOEIC");
    expect(instructions).toContain("workplace");
  });

  it("all personas include Vietnamese nudge after 2 consecutive turns", () => {
    for (const persona of PERSONAS) {
      const instructions = persona.buildInstructions({ consecutiveVietnameseTurns: 2 });
      expect(instructions).toContain("gently remind the learner to switch back to English");
    }
  });

  it("no persona includes Vietnamese nudge for 1 consecutive turn", () => {
    for (const persona of PERSONAS) {
      const instructions = persona.buildInstructions({ consecutiveVietnameseTurns: 1 });
      expect(instructions).not.toContain("gently remind the learner to switch back to English");
    }
  });
});
