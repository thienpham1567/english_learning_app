import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EnglishChatbotPage from "@/app/(app)/english-chatbot/page";
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
});
