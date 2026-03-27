import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EnglishChatbotPage, { getMessageSpacingClassName } from "@/app/(app)/english-chatbot/page";
import { renderUi } from "@/test/render";

describe("EnglishChatbotPage", () => {
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(
      screen.getByRole("heading", { name: "Xin chào! Cô Minh đây" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I goed to school/i }),
    ).toBeInTheDocument();
  });

  it("keeps grouped spacing between same-role and role-switch messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "assistant", text: "Second assistant" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[4px]");

    expect(
      getMessageSpacingClassName(
        { id: "2", role: "user", text: "User reply" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[22px]");
  });
});
