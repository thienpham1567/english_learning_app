import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatWindow } from "@/components/app/english-chatbot/ChatWindow";
import { ChatConversationProvider } from "@/components/app/english-chatbot/ChatConversationProvider";
import { renderUi } from "@/test/render";

vi.mock("@/lib/http", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

function renderChatWindow() {
  return renderUi(
    <ChatConversationProvider>
      <ChatWindow conversationId={null} />
    </ChatConversationProvider>,
  );
}

describe("ChatWindow empty state icon", () => {
  it("does not render the static English Tutor logo image", () => {
    renderChatWindow();
    expect(screen.queryByAltText("English Tutor")).not.toBeInTheDocument();
  });

  it("still renders the welcome heading", () => {
    renderChatWindow();
    expect(
      screen.getByRole("heading", {
        name: "Xin chào! Chọn gia sư để bắt đầu",
      }),
    ).toBeInTheDocument();
  });
});
