import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FuelExecutionTimeline } from "@/components/app/fuel-chat/FuelChatParts";

describe("FuelExecutionTimeline", () => {
  it("renders a completed function card with function name, status, input, and output", () => {
    render(
      <FuelExecutionTimeline
        calls={[
          {
            id: "call-price-1",
            name: "gia_xang",
            status: "success",
            input: {},
            output: {
              status: "success",
              prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("gia_xang")).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.getByText("INPUT")).toBeInTheDocument();
    expect(screen.getByText("OUTPUT")).toBeInTheDocument();
    expect(screen.getByText("{}")).toBeInTheDocument();
    expect(screen.getByText(/"status": "success"/)).toBeInTheDocument();
    expect(screen.getByText(/"product": "Xăng RON 95-III"/)).toBeInTheDocument();
  });

  it("renders an error function card with the failed output payload", () => {
    render(
      <FuelExecutionTimeline
        calls={[
          {
            id: "call-discord-1",
            name: "send_discord_message_via_webhook",
            status: "error",
            input: { content: "Báo cáo test" },
            output: { success: false, message: "Webhook không hợp lệ." },
            error: "Webhook không hợp lệ.",
          },
        ]}
      />,
    );

    expect(
      screen.getByText("send_discord_message_via_webhook"),
    ).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
    expect(screen.getByText(/"content": "Báo cáo test"/)).toBeInTheDocument();
    expect(
      screen.getByText(/"message": "Webhook không hợp lệ."/),
    ).toBeInTheDocument();
  });
});
