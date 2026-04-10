import { describe, expect, it } from "vitest";
import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";

describe("buildChatInstructions", () => {
  it("includes a reminder after two consecutive Vietnamese turns", () => {
    expect(buildChatInstructions({ consecutiveVietnameseTurns: 2, personaId: "simon" })).toContain(
      "gently remind the learner to switch back to English",
    );
  });

  it("includes a reminder after three consecutive Vietnamese turns", () => {
    expect(buildChatInstructions({ consecutiveVietnameseTurns: 3, personaId: "simon" })).toContain(
      "gently remind the learner to switch back to English",
    );
  });

  it("does not include a reminder after one consecutive Vietnamese turn", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 1, personaId: "simon" }),
    ).not.toContain("gently remind the learner to switch back to English");
  });

  it("returns christine persona instructions for 'christine'", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 0, personaId: "christine" }),
    ).toContain("Christine Ho");
  });

  it("falls back to simon for unknown personaId", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 0, personaId: "unknown" }),
    ).toContain("Simon Hosking");
  });
});
