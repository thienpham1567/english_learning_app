import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "user-1" },
      }),
    },
  },
}));

vi.mock("@/lib/fuel-prices/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

const mockResponsesCreate = vi.fn();
const mockExecuteFuelTool = vi.fn();

beforeEach(() => {
  vi.resetModules();
  mockResponsesCreate.mockReset();
  mockExecuteFuelTool.mockReset();
});

afterEach(() => {
  vi.resetModules();
});

function mockRouteDependencies() {
  vi.doMock("@/lib/openai/client", () => ({
    openAiClient: {
      responses: {
        create: mockResponsesCreate,
      },
    },
  }));

  vi.doMock("@/lib/openai/config", () => ({
    openAiConfig: {
      apiKey: "test",
      chatModel: "gpt-4.1-mini",
      dictionaryModel: "gpt-4.1-mini",
      dictionaryCacheTtlMs: 14 * 24 * 60 * 60 * 1000,
    },
  }));

  vi.doMock("@/lib/fuel-prices/tools", () => ({
    FUEL_TOOLS: [],
    FUEL_PRICE_INSTRUCTIONS: "fuel instructions",
    buildFuelChatInput: vi.fn((messages) => messages),
    executeFuelTool: mockExecuteFuelTool,
  }));
}

function createFuelRequest(messages: Array<{ role: string; text: string }>) {
  return new Request("http://localhost/api/fuel-prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });
}

describe("fuel prices route", () => {
  it("streams tool-first lifecycle events and attaches final text to tool_result", async () => {
    mockResponsesCreate
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            id: "fc_1",
            call_id: "call_1",
            name: "get_fuel_prices",
            arguments: "{}",
          },
        ],
      })
      .mockResolvedValueOnce({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "| Xăng RON 95 | 24.332 |",
              },
            ],
          },
        ],
      });

    mockExecuteFuelTool.mockResolvedValue({
      content: JSON.stringify({
        success: true,
        prices: [{ name: "Xăng RON 95-III", price: "24.332" }],
        updatedAt: "08:52 01/04/2026",
        source: "PVOIL (pvoil.com.vn)",
        articleUrl: "https://www.pvoil.com.vn/tin-gia-xang-dau",
      }),
      thinking: [
        "Đang kiểm tra nguồn giá xăng hiện có",
        "Đã lấy dữ liệu từ PVOIL",
      ],
      sources: [
        {
          label: "PVOIL (pvoil.com.vn)",
          href: "https://www.pvoil.com.vn/tin-gia-xang-dau",
          updatedAt: "08:52 01/04/2026",
        },
      ],
      renderingHint: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
      resultPreview: "1 loại nhiên liệu đã được cập nhật.",
    });

    mockRouteDependencies();

    const { POST } = await import("@/app/api/fuel-prices/route");
    const response = await POST(
      createFuelRequest([{ role: "user", text: "Giá xăng hôm nay?" }]),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('data: {"type":"run_start"');
    expect(body).toContain(
      'data: {"type":"tool_start","toolCallId":"call_1","tool":"get_fuel_prices","name":"Lấy giá mới nhất","params":{}',
    );
    expect(body).toContain(
      'data: {"type":"tool_thinking","toolCallId":"call_1","message":"Đang kiểm tra nguồn giá xăng hiện có"}',
    );
    expect(body).toContain(
      'data: {"type":"tool_source","toolCallId":"call_1","source":{"label":"PVOIL (pvoil.com.vn)","href":"https://www.pvoil.com.vn/tin-gia-xang-dau","updatedAt":"08:52 01/04/2026"}}',
    );
    expect(body).toContain(
      'data: {"type":"tool_rendering","toolCallId":"call_1","message":"Đang dựng bảng Markdown cho toàn bộ nhiên liệu"}',
    );
    expect(body).toContain(
      'data: {"type":"tool_result","toolCallId":"call_1","resultMarkdown":"| Xăng RON 95 | 24.332 |","resultPreview":"1 loại nhiên liệu đã được cập nhật."',
    );
    expect(body).toContain('data: {"type":"run_done"');
    expect(body).not.toContain('"type":"assistant_delta"');
    expect(body).not.toContain('"type":"agent_start"');
  });

  it("keeps multiple tool calls in a single execution panel stream", async () => {
    mockResponsesCreate
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            id: "fc_1",
            call_id: "call_1",
            name: "get_fuel_prices",
            arguments: "{}",
          },
        ],
      })
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            id: "fc_2",
            call_id: "call_2",
            name: "send_discord_report",
            arguments: "{\"content\":\"Báo cáo test\"}",
          },
        ],
      })
      .mockResolvedValueOnce({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Đã gửi báo cáo lên Discord.",
              },
            ],
          },
        ],
      });

    mockExecuteFuelTool
      .mockResolvedValueOnce({
        content: JSON.stringify({
          success: true,
          prices: [{ name: "Xăng RON 95-III", price: "24.332" }],
        }),
        thinking: ["Đã lấy dữ liệu từ PVOIL"],
        sources: [{ label: "PVOIL (pvoil.com.vn)" }],
        renderingHint: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
        resultPreview: "1 loại nhiên liệu đã được cập nhật.",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({
          success: true,
          message: "Đã gửi báo cáo lên Discord thành công!",
        }),
        thinking: ["Đang kiểm tra cấu hình webhook Discord"],
        renderingHint: "Đang tổng hợp trạng thái gửi báo cáo lên Discord",
        resultPreview: "Đã gửi báo cáo lên Discord thành công!",
      });

    mockRouteDependencies();

    const { POST } = await import("@/app/api/fuel-prices/route");
    const response = await POST(
      createFuelRequest([{ role: "user", text: "Lấy giá xăng rồi gửi Discord" }]),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"toolCallId":"call_1"');
    expect(body).toContain('"toolCallId":"call_2"');
    expect(body).toContain("Đã gửi báo cáo lên Discord.");
    expect(body).not.toContain('"type":"agent_start"');
  });
});
