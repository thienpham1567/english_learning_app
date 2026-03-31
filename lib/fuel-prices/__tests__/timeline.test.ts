import { describe, expect, it } from "vitest";

import { applyFuelSseEvent } from "@/lib/fuel-prices/timeline";
import type {
  FuelExecutionStep,
  FuelSseEventPayload,
} from "@/lib/fuel-prices/types";

type TestMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timeline?: FuelExecutionStep[];
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
  it("records a finished agent with its finished tool under the active assistant message", () => {
    const messages: TestMessage[] = [
      { id: "user-1", role: "user", text: "Giá xăng hôm nay bao nhiêu?" },
      { id: "assistant-1", role: "assistant", text: "" },
    ];

    const result = applySequence(messages, "assistant-1", [
      {
        type: "agent_start",
        agentId: "agent-price-1",
        name: "Trợ lý giá xăng",
        summary: "Phân tích yêu cầu tra cứu giá mới nhất",
        startedAt: "2026-03-31T13:00:00.000Z",
      },
      {
        type: "tool_call",
        toolCallId: "tool-price-1",
        agentId: "agent-price-1",
        name: "Lấy giá mới nhất",
        tool: "get_fuel_prices",
        summary: "Lấy bảng giá mới nhất từ PVOIL",
        params: {},
        startedAt: "2026-03-31T13:00:01.000Z",
      },
      {
        type: "tool_result",
        toolCallId: "tool-price-1",
        agentId: "agent-price-1",
        name: "Lấy giá mới nhất",
        tool: "get_fuel_prices",
        resultPreview: "5 loại nhiên liệu đã được cập nhật.",
        finishedAt: "2026-03-31T13:00:02.000Z",
      },
      {
        type: "agent_done",
        agentId: "agent-price-1",
        resultPreview: "Đã sẵn sàng tổng hợp bảng giá xăng dầu.",
        finishedAt: "2026-03-31T13:00:03.000Z",
      },
      {
        type: "assistant_delta",
        delta: "| Xăng RON 95 | 24.332 |",
      },
    ]);

    expect(result.at(-1)).toEqual({
      id: "assistant-1",
      role: "assistant",
      text: "| Xăng RON 95 | 24.332 |",
      timeline: [
        {
          id: "agent-price-1",
          kind: "agent",
          name: "Trợ lý giá xăng",
          status: "done",
          summary: "Phân tích yêu cầu tra cứu giá mới nhất",
          resultPreview: "Đã sẵn sàng tổng hợp bảng giá xăng dầu.",
          startedAt: "2026-03-31T13:00:00.000Z",
          finishedAt: "2026-03-31T13:00:03.000Z",
        },
        {
          id: "tool-price-1",
          parentId: "agent-price-1",
          kind: "tool",
          name: "Lấy giá mới nhất",
          tool: "get_fuel_prices",
          status: "done",
          summary: "Lấy bảng giá mới nhất từ PVOIL",
          params: {},
          resultPreview: "5 loại nhiên liệu đã được cập nhật.",
          startedAt: "2026-03-31T13:00:01.000Z",
          finishedAt: "2026-03-31T13:00:02.000Z",
        },
      ],
    });
  });

  it("marks an agent and its tool as failed when error events arrive", () => {
    const messages: TestMessage[] = [
      { id: "assistant-2", role: "assistant", text: "" },
    ];

    const result = applySequence(messages, "assistant-2", [
      {
        type: "agent_start",
        agentId: "agent-discord-1",
        name: "Trợ lý giá xăng",
        summary: "Chuẩn bị gửi báo cáo lên Discord",
        startedAt: "2026-03-31T13:05:00.000Z",
      },
      {
        type: "tool_call",
        toolCallId: "tool-discord-1",
        agentId: "agent-discord-1",
        name: "Gửi Discord",
        tool: "send_discord_report",
        params: { content: "Báo cáo test" },
        startedAt: "2026-03-31T13:05:01.000Z",
      },
      {
        type: "tool_error",
        toolCallId: "tool-discord-1",
        agentId: "agent-discord-1",
        name: "Gửi Discord",
        tool: "send_discord_report",
        message: "Webhook không hợp lệ.",
        finishedAt: "2026-03-31T13:05:02.000Z",
      },
      {
        type: "agent_error",
        agentId: "agent-discord-1",
        message: "Không thể gửi báo cáo lên Discord.",
        finishedAt: "2026-03-31T13:05:03.000Z",
      },
    ]);

    expect(result[0].timeline).toEqual([
      {
        id: "agent-discord-1",
        kind: "agent",
        name: "Trợ lý giá xăng",
        status: "error",
        summary: "Chuẩn bị gửi báo cáo lên Discord",
        error: "Không thể gửi báo cáo lên Discord.",
        startedAt: "2026-03-31T13:05:00.000Z",
        finishedAt: "2026-03-31T13:05:03.000Z",
      },
      {
        id: "tool-discord-1",
        parentId: "agent-discord-1",
        kind: "tool",
        name: "Gửi Discord",
        tool: "send_discord_report",
        status: "error",
        params: { content: "Báo cáo test" },
        error: "Webhook không hợp lệ.",
        startedAt: "2026-03-31T13:05:01.000Z",
        finishedAt: "2026-03-31T13:05:02.000Z",
      },
    ]);
  });
});
