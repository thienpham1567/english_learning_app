import { describe, expect, it } from "vitest";
import { getMessageSpacingClassName } from "@/components/app/ChatWindow";
import type { PageMessage } from "@/components/ChatMessage";

describe("getMessageSpacingClassName", () => {
  it("returns empty string when there is no previous message", () => {
    const msg: PageMessage = { id: "1", role: "user", text: "Hello" };
    expect(getMessageSpacingClassName(msg, undefined)).toBe("");
  });

  it("returns mt-[4px] for consecutive same-role messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "assistant", text: "Second assistant" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[4px]");
  });

  it("returns mt-[28px] for role-switch messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "user", text: "User reply" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[28px]");
  });

  it("returns mt-[28px] for a divider following a user message", () => {
    expect(
      getMessageSpacingClassName(
        { id: "d1", role: "divider", text: "Switched to Christine Ho — IELTS Master" },
        { id: "1", role: "user", text: "Hello" },
      ),
    ).toBe("mt-[28px]");
  });
});
