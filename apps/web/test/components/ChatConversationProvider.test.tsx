import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ChatConversationProvider,
  useChatConversations,
} from "@/components/app/english-chatbot/ChatConversationProvider";

// Mock http module
vi.mock("@/lib/http", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import http from "@/lib/http";

const mockHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function TestConsumer() {
  const { conversations, loadConversations, deleteConversation } =
    useChatConversations();
  return (
    <div>
      <span data-testid="count">{conversations.length}</span>
      {conversations.map((c) => (
        <span key={c.id} data-testid={`conv-${c.id}`}>
          {c.title}
        </span>
      ))}
      <button onClick={loadConversations}>reload</button>
      <button onClick={() => deleteConversation("abc")}>delete</button>
    </div>
  );
}

describe("ChatConversationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads conversations on mount", async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: [
        {
          id: "1",
          title: "Hello",
          updatedAt: "2026-01-01",
          personaId: "simon",
        },
      ],
    });

    render(
      <ChatConversationProvider>
        <TestConsumer />
      </ChatConversationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
    expect(screen.getByTestId("conv-1").textContent).toBe("Hello");
  });

  it("deleteConversation removes item from list and calls API", async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: [
        {
          id: "abc",
          title: "Chat 1",
          updatedAt: "2026-01-01",
          personaId: "simon",
        },
        {
          id: "def",
          title: "Chat 2",
          updatedAt: "2026-01-01",
          personaId: "simon",
        },
      ],
    });
    mockHttp.delete.mockResolvedValueOnce({});

    render(
      <ChatConversationProvider>
        <TestConsumer />
      </ChatConversationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("2");
    });

    await userEvent.click(screen.getByText("delete"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
    expect(mockHttp.delete).toHaveBeenCalledWith("/conversations/abc");
  });

  it("throws when useChatConversations is used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    spy.mockRestore();
  });
});
