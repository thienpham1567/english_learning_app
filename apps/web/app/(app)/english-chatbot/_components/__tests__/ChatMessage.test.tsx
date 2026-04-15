import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { renderUi } from "@/test/render";

vi.mock("@/components/shared/UserContext", () => ({
  useUser: () => ({ name: "Người học", image: null }),
}));

describe("ChatMessage", () => {
  it("renders assistant markdown content", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "**Hello**" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("keeps message meta hidden until hover", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "Hello" }} />);

    const meta = screen.getByText(/\d{2}:\d{2}/).parentElement;
    expect(meta).toHaveClass("opacity-0");
    expect(meta).toHaveClass("group-hover:opacity-100");
  });

  it("renders a divider with the persona switch label", () => {
    renderUi(
      <ChatMessage
        message={{ id: "d1", role: "divider", text: "Switched to Christine Ho — IELTS Master" }}
      />,
    );
    expect(screen.getByText("Switched to Christine Ho — IELTS Master")).toBeInTheDocument();
  });

  it("renders the blinking cursor when text is empty and isStreaming is true", () => {
    const { container } = renderUi(
      <ChatMessage message={{ id: "s1", role: "assistant", text: "" }} isStreaming={true} />,
    );
    const cursor = container.querySelector('[aria-hidden="true"]');
    expect(cursor).not.toBeNull();
  });

  it("keeps long assistant replies inside the main transcript scroller", () => {
    const { container } = renderUi(
      <ChatMessage
        message={{
          id: "long-1",
          role: "assistant",
          text: "Paragraph\n\n".repeat(80),
        }}
      />,
    );

    const markdownBody = container.querySelector(".rounded-bl-md > div");
    expect(markdownBody).not.toHaveClass("max-h-[60vh]", "overflow-y-auto");
  });
});
