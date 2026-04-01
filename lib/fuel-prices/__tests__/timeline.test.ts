import { describe, expect, it } from "vitest";

import { applyFuelSseEvent } from "@/lib/fuel-prices/timeline";
import type {
  FuelChatTurn,
  FuelSseEventPayload,
} from "@/lib/fuel-prices/types";

function applySequence(
  turns: FuelChatTurn[],
  assistantMessageId: string,
  events: FuelSseEventPayload[],
) {
  return events.reduce(
    (current, event) => applyFuelSseEvent(current, assistantMessageId, event),
    turns,
  );
}

describe("applyFuelSseEvent", () => {
  it("builds a tool run and stores the final markdown on the tool result", () => {
    const turns: FuelChatTurn[] = [
      { id: "user-1", role: "user", text: "Xăng hôm nay bao nhiêu?" },
      {
        id: "assistant-1",
        role: "assistant",
        run: { status: "pending", tools: [] },
      },
    ];

    const result = applySequence(turns, "assistant-1", [
      { type: "run_start", startedAt: "2026-04-01T01:00:00.000Z" },
      {
        type: "tool_start",
        toolCallId: "tool-1",
        tool: "get_fuel_prices",
        name: "Lấy giá mới nhất",
        params: {},
        startedAt: "2026-04-01T01:00:01.000Z",
      },
      {
        type: "tool_thinking",
        toolCallId: "tool-1",
        message: "Đang xác định nguồn có dữ liệu mới nhất",
      },
      {
        type: "tool_source",
        toolCallId: "tool-1",
        source: {
          label: "PVOIL (pvoil.com.vn)",
          href: "https://www.pvoil.com.vn/tin-gia-xang-dau",
          updatedAt: "08:52 01/04/2026",
        },
      },
      {
        type: "tool_rendering",
        toolCallId: "tool-1",
        message: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
      },
      {
        type: "tool_result",
        toolCallId: "tool-1",
        resultMarkdown: "| Sản phẩm | Giá |",
        resultPreview: "Đã dựng bảng giá xăng dầu hoàn chỉnh.",
        finishedAt: "2026-04-01T01:00:02.000Z",
      },
      { type: "run_done", finishedAt: "2026-04-01T01:00:03.000Z" },
    ]);

    expect(result.at(-1)).toEqual({
      id: "assistant-1",
      role: "assistant",
      run: {
        status: "done",
        startedAt: "2026-04-01T01:00:00.000Z",
        finishedAt: "2026-04-01T01:00:03.000Z",
        tools: [
          {
            id: "tool-1",
            tool: "get_fuel_prices",
            name: "Lấy giá mới nhất",
            status: "done",
            params: {},
            thinking: ["Đang xác định nguồn có dữ liệu mới nhất"],
            sources: [
              {
                label: "PVOIL (pvoil.com.vn)",
                href: "https://www.pvoil.com.vn/tin-gia-xang-dau",
                updatedAt: "08:52 01/04/2026",
              },
            ],
            rendering: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
            resultMarkdown: "| Sản phẩm | Giá |",
            resultPreview: "Đã dựng bảng giá xăng dầu hoàn chỉnh.",
            startedAt: "2026-04-01T01:00:01.000Z",
            finishedAt: "2026-04-01T01:00:02.000Z",
          },
        ],
      },
    });
  });

  it("keeps multiple tools in order and marks tool-level errors without any agent layer", () => {
    const turns: FuelChatTurn[] = [
      {
        id: "assistant-2",
        role: "assistant",
        run: { status: "pending", tools: [] },
      },
    ];

    const result = applySequence(turns, "assistant-2", [
      { type: "run_start", startedAt: "2026-04-01T01:05:00.000Z" },
      {
        type: "tool_start",
        toolCallId: "tool-a",
        tool: "get_fuel_prices",
        name: "Lấy giá mới nhất",
        startedAt: "2026-04-01T01:05:01.000Z",
      },
      {
        type: "tool_result",
        toolCallId: "tool-a",
        resultMarkdown: "Bảng giá xăng",
        finishedAt: "2026-04-01T01:05:02.000Z",
      },
      {
        type: "tool_start",
        toolCallId: "tool-b",
        tool: "send_discord_report",
        name: "Gửi Discord",
        params: { content: "Báo cáo test" },
        startedAt: "2026-04-01T01:05:03.000Z",
      },
      {
        type: "tool_error",
        toolCallId: "tool-b",
        message: "Webhook không hợp lệ.",
        finishedAt: "2026-04-01T01:05:04.000Z",
      },
      { type: "run_done", finishedAt: "2026-04-01T01:05:05.000Z" },
    ]);

    expect(result[0].run?.tools.map((tool) => tool.tool)).toEqual([
      "get_fuel_prices",
      "send_discord_report",
    ]);
    expect(result[0].run?.tools[1]).toMatchObject({
      tool: "send_discord_report",
      status: "error",
      error: "Webhook không hợp lệ.",
    });
  });
});
