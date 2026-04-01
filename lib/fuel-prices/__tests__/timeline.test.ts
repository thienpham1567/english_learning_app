import { describe, expect, it } from "vitest";

import { applyFuelSseEvent } from "@/lib/fuel-prices/timeline";
import type { FuelSseEventPayload } from "@/lib/fuel-prices/types";

type TestMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  functionCalls?: Array<{
    id: string;
    name: string;
    status: "running" | "success" | "error";
    input: Record<string, unknown>;
    output?: unknown;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
  }>;
};

function applySequence(
  messages: TestMessage[],
  assistantMessageId: string,
  events: FuelSseEventPayload[],
) {
  return events.reduce(
    (current, event) => applyFuelSseEvent(current, assistantMessageId, event),
    messages,
  );
}

describe("applyFuelSseEvent", () => {
  it("stores a completed function call with input and output on the active assistant message", () => {
    const messages: TestMessage[] = [
      { id: "user-1", role: "user", text: "Giá xăng hôm nay bao nhiêu?" },
      { id: "assistant-1", role: "assistant", text: "" },
    ];

    const result = applySequence(messages, "assistant-1", [
      {
        type: "function_call_start",
        callId: "call-price-1",
        name: "gia_xang",
        input: {},
        startedAt: "2026-04-01T01:00:00.000Z",
      } as FuelSseEventPayload,
      {
        type: "function_call_result",
        callId: "call-price-1",
        name: "gia_xang",
        input: {},
        output: {
          status: "success",
          update_time: "Giá điều chỉnh lúc 00:00 ngày 27/03/2026",
          prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
        },
        finishedAt: "2026-04-01T01:00:01.000Z",
      } as FuelSseEventPayload,
      {
        type: "assistant_delta",
        delta: "| Xăng RON 95 | 24.332 |",
      },
    ]);

    expect(result.at(-1)).toEqual({
      id: "assistant-1",
      role: "assistant",
      text: "| Xăng RON 95 | 24.332 |",
      functionCalls: [
        {
          id: "call-price-1",
          name: "gia_xang",
          status: "success",
          input: {},
          output: {
            status: "success",
            update_time: "Giá điều chỉnh lúc 00:00 ngày 27/03/2026",
            prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
          },
          startedAt: "2026-04-01T01:00:00.000Z",
          finishedAt: "2026-04-01T01:00:01.000Z",
        },
      ],
    });
  });

  it("marks a function call as failed and preserves its input", () => {
    const messages: TestMessage[] = [
      { id: "assistant-2", role: "assistant", text: "" },
    ];

    const result = applySequence(messages, "assistant-2", [
      {
        type: "function_call_start",
        callId: "call-discord-1",
        name: "send_discord_message_via_webhook",
        input: { content: "Báo cáo test" },
        startedAt: "2026-04-01T01:05:00.000Z",
      } as FuelSseEventPayload,
      {
        type: "function_call_error",
        callId: "call-discord-1",
        name: "send_discord_message_via_webhook",
        input: { content: "Báo cáo test" },
        output: { success: false, message: "Webhook không hợp lệ." },
        message: "Webhook không hợp lệ.",
        finishedAt: "2026-04-01T01:05:01.000Z",
      } as FuelSseEventPayload,
    ]);

    expect(result[0].functionCalls).toEqual([
      {
        id: "call-discord-1",
        name: "send_discord_message_via_webhook",
        status: "error",
        input: { content: "Báo cáo test" },
        output: { success: false, message: "Webhook không hợp lệ." },
        error: "Webhook không hợp lệ.",
        startedAt: "2026-04-01T01:05:00.000Z",
        finishedAt: "2026-04-01T01:05:01.000Z",
      },
    ]);
  });
});
