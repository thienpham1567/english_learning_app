import { describe, expect, it } from "vitest";

import { applyFuelSseEvent } from "@/lib/fuel-prices/timeline";
import type { FuelChatTurn, FuelSseEventPayload } from "@/lib/fuel-prices/types";

describe("applyFuelSseEvent", () => {
  it("stores a completed function-style tool with input, output, and markdown result", () => {
    const turns: FuelChatTurn[] = [
      { id: "user-1", role: "user", text: "Giá xăng hôm nay bao nhiêu?" },
      { id: "assistant-1", role: "assistant", run: { status: "pending", tools: [] } },
    ];

    const events: FuelSseEventPayload[] = [
      {
        type: "run_start",
        startedAt: "2026-04-01T01:00:00.000Z",
      },
      {
        type: "tool_start",
        toolCallId: "call-price-1",
        tool: "get_fuel_prices",
        name: "gia_xang",
        input: {},
        startedAt: "2026-04-01T01:00:00.000Z",
      },
      {
        type: "tool_result",
        toolCallId: "call-price-1",
        output: {
          status: "success",
          update_time: "Giá điều chỉnh lúc 00:00 ngày 27/03/2026",
          prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
        },
        finishedAt: "2026-04-01T01:00:01.000Z",
      },
      {
        type: "tool_result",
        toolCallId: "call-price-1",
        resultMarkdown: "Bạn có muốn tôi gửi báo cáo này lên Discord không?",
        finishedAt: "2026-04-01T01:00:02.000Z",
      },
      {
        type: "run_done",
        finishedAt: "2026-04-01T01:00:02.000Z",
      },
    ];

    const result = events.reduce(
      (current, event) => applyFuelSseEvent(current, "assistant-1", event),
      turns,
    );

    expect(result[1]).toEqual({
      id: "assistant-1",
      role: "assistant",
      run: {
        status: "done",
        startedAt: "2026-04-01T01:00:00.000Z",
        finishedAt: "2026-04-01T01:00:02.000Z",
        tools: [
          {
            id: "call-price-1",
            tool: "get_fuel_prices",
            name: "gia_xang",
            status: "done",
            input: {},
            output: {
              status: "success",
              update_time: "Giá điều chỉnh lúc 00:00 ngày 27/03/2026",
              prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
            },
            resultMarkdown: "Bạn có muốn tôi gửi báo cáo này lên Discord không?",
            startedAt: "2026-04-01T01:00:00.000Z",
            finishedAt: "2026-04-01T01:00:02.000Z",
          },
        ],
      },
    });
  });

  it("marks a tool as failed and stores the error payload", () => {
    const turns: FuelChatTurn[] = [
      { id: "assistant-2", role: "assistant", run: { status: "pending", tools: [] } },
    ];

    const result = [
      {
        type: "tool_start",
        toolCallId: "call-discord-1",
        tool: "send_discord_report",
        name: "send_discord_message_via_webhook",
        input: { content: "Báo cáo test" },
        startedAt: "2026-04-01T01:05:00.000Z",
      },
      {
        type: "tool_error",
        toolCallId: "call-discord-1",
        message: "Webhook không hợp lệ.",
        output: { success: false, message: "Webhook không hợp lệ." },
        finishedAt: "2026-04-01T01:05:01.000Z",
      },
      {
        type: "run_error",
        message: "Webhook không hợp lệ.",
        finishedAt: "2026-04-01T01:05:01.000Z",
      },
    ].reduce(
      (current, event) =>
        applyFuelSseEvent(current, "assistant-2", event as FuelSseEventPayload),
      turns,
    );

    expect(result[0]).toEqual({
      id: "assistant-2",
      role: "assistant",
      run: {
        status: "error",
        error: "Webhook không hợp lệ.",
        finishedAt: "2026-04-01T01:05:01.000Z",
        tools: [
          {
            id: "call-discord-1",
            tool: "send_discord_report",
            name: "send_discord_message_via_webhook",
            status: "error",
            input: { content: "Báo cáo test" },
            output: { success: false, message: "Webhook không hợp lệ." },
            error: "Webhook không hợp lệ.",
            startedAt: "2026-04-01T01:05:00.000Z",
            finishedAt: "2026-04-01T01:05:01.000Z",
          },
        ],
      },
    });
  });
});
