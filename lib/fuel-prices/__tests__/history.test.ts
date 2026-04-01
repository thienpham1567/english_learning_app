import { describe, expect, it } from "vitest";

import { buildFuelChatHistory } from "@/lib/fuel-prices/history";
import type { FuelAssistantRun, FuelChatTurn } from "@/lib/fuel-prices/types";

function createAssistantTurn(run: FuelAssistantRun): Extract<FuelChatTurn, { role: "assistant" }> {
  return {
    id: "assistant-1",
    role: "assistant",
    run,
  };
}

describe("buildFuelChatHistory", () => {
  it("preserves assistant result markdown so affirmative replies keep Discord context", () => {
    const turns: FuelChatTurn[] = [
      {
        id: "user-1",
        role: "user",
        text: "Xăng hôm nay bao nhiêu?",
      },
      createAssistantTurn({
        status: "done",
        tools: [
          {
            id: "tool-1",
            tool: "get_fuel_prices",
            name: "Lấy giá mới nhất",
            status: "done",
            thinking: [],
            sources: [
              {
                label: "PVOIL (pvoil.com.vn)",
                href: "https://www.pvoil.com.vn/tin-gia-xang-dau",
                updatedAt: "10:06:08 1/4/2026",
              },
            ],
            rendering: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
            resultPreview: "3 loại nhiên liệu đã được cập nhật.",
            resultMarkdown:
              "Đã có bạn 😌 Đây là giá xăng/dầu hôm nay.\n\nBạn có muốn tôi gửi báo cáo này lên Discord không?",
          },
        ],
      }),
      {
        id: "user-2",
        role: "user",
        text: "có",
      },
    ];

    const history = buildFuelChatHistory(turns);

    expect(history).toHaveLength(3);
    expect(history[1]).toEqual({
      role: "assistant",
      text: expect.stringContaining(
        "Bạn có muốn tôi gửi báo cáo này lên Discord không?",
      ),
    });
    expect(history[2]).toEqual({
      role: "user",
      text: "có",
    });
  });

  it("falls back to previews and errors when a tool has no full markdown result", () => {
    const turns: FuelChatTurn[] = [
      createAssistantTurn({
        status: "done",
        tools: [
          {
            id: "tool-1",
            tool: "send_discord_report",
            name: "Gửi Discord",
            status: "done",
            thinking: [],
            sources: [],
            resultPreview: "Đã gửi báo cáo lên Discord thành công!",
          },
          {
            id: "tool-2",
            tool: "compare_fuel_prices",
            name: "So sánh với snapshot trước",
            status: "error",
            thinking: [],
            sources: [],
            error: "Chưa có dữ liệu cũ để so sánh.",
          },
        ],
      }),
    ];

    const history = buildFuelChatHistory(turns);

    expect(history).toEqual([
      {
        role: "assistant",
        text: [
          "[Tool: Gửi Discord]",
          "Đã gửi báo cáo lên Discord thành công!",
          "",
          "[Tool: So sánh với snapshot trước]",
          "Lỗi: Chưa có dữ liệu cũ để so sánh.",
        ].join("\n"),
      },
    ]);
  });
});
