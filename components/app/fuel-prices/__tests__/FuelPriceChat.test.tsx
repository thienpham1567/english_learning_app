import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FuelPriceChat } from "@/components/app/fuel-prices/FuelPriceChat";

vi.mock("@/components/app/shared/UserContext", () => ({
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
              name: "gia_xang",
              status: "done",
              input: {},
              output: {
                status: "success",
                prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
              },
              resultMarkdown:
                "Giá xăng dầu mới nhất đây.\n\nBạn có muốn tôi gửi báo cáo này lên Discord không?",
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
  it("renders the function card above the assistant prose", () => {
    render(<FuelPriceChat />);

    expect(screen.getByText("Xăng hôm nay bao nhiêu?")).toBeInTheDocument();
    expect(screen.getByText("gia_xang")).toBeInTheDocument();
    expect(screen.getByText("INPUT")).toBeInTheDocument();
    expect(screen.getByText("OUTPUT")).toBeInTheDocument();
    expect(
      screen.getByText("Bạn có muốn tôi gửi báo cáo này lên Discord không?"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Call Agent")).not.toBeInTheDocument();
  });
});
