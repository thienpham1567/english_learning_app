import { describe, expect, it } from "vitest";
import { countConsecutiveVietnameseTurns } from "@/lib/chat/build-chat-input";
import type { ChatMessage } from "@/lib/chat/types";

function msg(role: "user" | "assistant", text: string): ChatMessage {
  return { id: `id-${Math.random()}`, role, text };
}

describe("countConsecutiveVietnameseTurns", () => {
  it("returns 0 for an empty message list", () => {
    expect(countConsecutiveVietnameseTurns([])).toBe(0);
  });

  it("returns 0 when the most recent user message is English", () => {
    expect(
      countConsecutiveVietnameseTurns([msg("user", "I want to practice")]),
    ).toBe(0);
  });

  it("counts consecutive Vietnamese user messages from the end", () => {
    expect(
      countConsecutiveVietnameseTurns([
        msg("user", "I want to practice"),
        msg("assistant", "Sure!"),
        msg("user", "Tôi cần giúp"),
        msg("user", "Tôi cần học"),
      ]),
    ).toBe(2);
  });

  it("does NOT reset the streak when a mixed-language message interrupts", () => {
    // Previously this returned 1 because "mixed" caused a break after counting the most recent Vietnamese.
    // With the fix, it should skip "mixed" and count both Vietnamese messages.
    expect(
      countConsecutiveVietnameseTurns([
        msg("user", "Tôi cần giúp"),
        msg("user", "Cô ơi, what does this mean?"), // mixed → should be skipped
        msg("user", "Tôi cần học"),
      ]),
    ).toBe(2);
  });

  it("does NOT reset the streak when an unknown-language message interrupts", () => {
    // Similar to mixed: unknown should be skipped, not break the streak.
    expect(
      countConsecutiveVietnameseTurns([
        msg("user", "Tôi cần giúp"),
        msg("user", "eco therapy"), // unknown → should be skipped
        msg("user", "Tôi cần học"),
      ]),
    ).toBe(2);
  });

  it("ignores assistant messages when counting", () => {
    expect(
      countConsecutiveVietnameseTurns([
        msg("user", "Tôi cần giúp"),
        msg("assistant", "Of course!"),
        msg("user", "Tôi muốn hỏi"),
      ]),
    ).toBe(2);
  });

  it("stops streak at a clear English user message after Vietnamese turns", () => {
    expect(
      countConsecutiveVietnameseTurns([
        msg("user", "I want to practice"),
        msg("user", "Tôi cần giúp"),
      ]),
    ).toBe(1);
  });
});
