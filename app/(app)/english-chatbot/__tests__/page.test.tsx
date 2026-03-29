import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EnglishChatbotPage, { getMessageSpacingClassName } from "@/app/(app)/english-chatbot/page";
import type { PageMessage } from "@/components/ChatMessage";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/UserContext", () => ({
  useUser: () => ({ name: "Người học", image: null }),
}));

describe("EnglishChatbotPage", () => {
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(
      screen.getByRole("heading", { name: "Xin chào! Chọn gia sư để bắt đầu" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I goed to school/i })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });

  it("keeps scrolling inside the transcript instead of the main page", () => {
    const { container } = renderUi(<EnglishChatbotPage />);
    const header = screen.getByText(/Chọn gia sư để bắt đầu/i)
      .closest("div[class*='overflow-y-auto']")
      ?.previousElementSibling as HTMLElement | null;
    const transcript = screen.getByText(/Chọn gia sư để bắt đầu/i)
      .closest("div[class*='overflow-y-auto']") as HTMLElement | null;
    const composer = screen.getByPlaceholderText(/Nhập câu hỏi/i)
      .closest("div[class*='backdrop-blur-md']") as HTMLElement | null;
    const chatArea = transcript?.parentElement as HTMLElement | null;

    expect(container.firstElementChild).toHaveClass(
      "flex",
      "h-full",
      "max-h-full",
      "min-h-0",
      "flex-1",
      "overflow-hidden",
    );

    expect(chatArea).toHaveClass("min-h-0", "overflow-hidden");
    expect(header).toHaveClass("shrink-0");

    expect(transcript).toHaveClass(
      "flex-1",
      "min-h-0",
      "overflow-y-auto",
    );

    expect(composer).toHaveClass("shrink-0");
  });
});

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
