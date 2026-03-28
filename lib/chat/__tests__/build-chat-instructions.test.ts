import { describe, expect, it } from "vitest";
import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";

describe("buildChatInstructions", () => {
  it("includes a reminder after two consecutive Vietnamese turns", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 2 }),
    ).toContain("gently remind the learner to switch back to English");
  });

  it("includes a reminder after three consecutive Vietnamese turns", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 3 }),
    ).toContain("gently remind the learner to switch back to English");
  });

  it("does not include a reminder after one consecutive Vietnamese turn", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 1 }),
    ).not.toContain("gently remind the learner to switch back to English");
  });
});
