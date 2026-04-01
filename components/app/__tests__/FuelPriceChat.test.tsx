import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FuelPriceChat } from "@/components/app/FuelPriceChat";

vi.mock("@/components/app/UserContext", () => ({
  useUser: () => ({
    name: "Test User",
    image: "",
  }),
}));

vi.mock("@/hooks/useFuelChat", () => ({
  useFuelChat: () => ({
    discordWebhookUrl: "",
    setDiscordWebhookUrl: vi.fn(),
    hasMessages: true,
    send: vi.fn(),
    scrollContainerRef: { current: null },
    handleScroll: vi.fn(),
    messages: [
      { id: "user-1", role: "user", text: "Xăng hôm nay bao nhiêu?" },
      {
        id: "assistant-1",
        role: "assistant",
        run: {
          status: "done",
          tools: [
            {
              id: "tool-1",
              tool: "get_fuel_prices",
              name: "Lấy giá mới nhất",
              status: "done",
              thinking: ["Đã lấy dữ liệu từ PVOIL"],
              sources: [{ label: "PVOIL (pvoil.com.vn)" }],
              rendering: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
              resultMarkdown: "| Sản phẩm | Giá |",
            },
          ],
        },
      },
    ],
    isLoading: false,
    streamingHasStarted: false,
    error: null,
    clearError: vi.fn(),
    bottomRef: { current: null },
    showScrollBtn: false,
    scrollToBottom: vi.fn(),
    input: "",
    textareaRef: { current: null },
    setInput: vi.fn(),
    autoResize: vi.fn(),
  }),
}));

describe("FuelPriceChat", () => {
  it("renders the execution panel instead of a detached assistant bubble", () => {
    render(<FuelPriceChat />);

    expect(screen.getByText("Xăng hôm nay bao nhiêu?")).toBeInTheDocument();
    expect(screen.getByText("Lấy giá mới nhất")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.queryByText("Call Agent")).not.toBeInTheDocument();
  });
});
