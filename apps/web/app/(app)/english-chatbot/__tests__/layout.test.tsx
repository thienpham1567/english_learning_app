import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EnglishChatbotLayout from "@/app/(app)/english-chatbot/layout";
import { renderUi } from "@/test/render";

vi.mock("@/lib/http", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn(),
  },
}));

vi.mock("@/components/app/ChatConversationProvider", () => ({
  ChatConversationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useChatConversations: () => ({
    conversations: [],
    setConversations: vi.fn(),
    loadConversations: vi.fn(),
    deleteConversation: vi.fn(),
  }),
}));

const mockUseParams = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  usePathname: () => "/english-chatbot",
}));

vi.mock("@/components/app/ChatWindow", () => ({
  ChatWindow: ({ conversationId }: { conversationId: string | null }) => (
    <div data-testid="chat-window" data-conversation-id={String(conversationId)} />
  ),
}));

vi.mock("@/components/app/ConversationList", () => ({
  ConversationList: () => <div data-testid="conversation-list" />,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({});
});

describe("EnglishChatbotLayout", () => {
  it("renders ChatWindow with null when there is no conversationId param", () => {
    renderUi(<EnglishChatbotLayout>{null}</EnglishChatbotLayout>);
    expect(screen.getByTestId("chat-window")).toHaveAttribute("data-conversation-id", "null");
  });

  it("renders ChatWindow with the conversationId from URL params", () => {
    mockUseParams.mockReturnValue({ conversationId: "abc-123" });
    renderUi(<EnglishChatbotLayout>{null}</EnglishChatbotLayout>);
    expect(screen.getByTestId("chat-window")).toHaveAttribute("data-conversation-id", "abc-123");
  });

  it("renders ConversationList alongside ChatWindow", () => {
    renderUi(<EnglishChatbotLayout>{null}</EnglishChatbotLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
  });
});
