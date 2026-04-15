import { describe, expect, it } from "vitest";
import { getMessageSpacingStyle } from "@/components/app/english-chatbot/ChatWindow";
import type { PageMessage } from "@/components/ChatMessage";

describe("getMessageSpacingStyle", () => {
  it("returns empty object when there is no previous message", () => {
    const msg: PageMessage = { id: "1", role: "user", text: "Hello" };
    expect(getMessageSpacingStyle(msg, undefined)).toEqual({});
  });

  it("returns marginTop 4 for consecutive same-role messages", () => {
    expect(
      getMessageSpacingStyle(
        { id: "2", role: "assistant", text: "Second assistant" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toEqual({ marginTop: 4 });
  });

  it("returns marginTop 28 for role-switch messages", () => {
    expect(
      getMessageSpacingStyle(
        { id: "2", role: "user", text: "User reply" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toEqual({ marginTop: 28 });
  });

  it("returns marginTop 28 for a divider following a user message", () => {
    expect(
      getMessageSpacingStyle(
        { id: "d1", role: "divider", text: "Switched to Christine Ho — IELTS Master" },
        { id: "1", role: "user", text: "Hello" },
      ),
    ).toEqual({ marginTop: 28 });
  });
});
