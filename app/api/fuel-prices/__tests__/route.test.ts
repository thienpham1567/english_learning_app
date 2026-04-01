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

describe("fuel prices route", () => {
  it("streams gia_xang tool events with empty input, JSON output, and prose result", async () => {
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
                text: "Giá xăng mới nhất đây.\n\nBạn có muốn tôi gửi báo cáo này lên Discord không?",
              },
            ],
          },
        ],
      });

    mockExecuteFuelTool.mockResolvedValue({
      content: JSON.stringify({
        status: "success",
        update_time: "Giá điều chỉnh lúc 00:00 ngày 27/03/2026",
        prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
      }),
      resultPreview: "1 loại nhiên liệu đã được cập nhật.",
    });

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

    const { POST } = await import("@/app/api/fuel-prices/route");
    const request = new Request("http://localhost/api/fuel-prices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", text: "Giá xăng hôm nay?" }],
      }),
    });

    const response = await POST(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('data: {"type":"run_start"');
    expect(body).toContain(
      'data: {"type":"tool_start","toolCallId":"call_1","tool":"get_fuel_prices","name":"gia_xang","input":{}',
    );
    expect(body).toContain(
      'data: {"type":"tool_result","toolCallId":"call_1","output":{"status":"success","update_time":"Giá điều chỉnh lúc 00:00 ngày 27/03/2026","prices":[{"product":"Xăng RON 95-III","price":"24.330 đ"}]},"resultPreview":"1 loại nhiên liệu đã được cập nhật."',
    );
    expect(body).toContain(
      'data: {"type":"tool_result","toolCallId":"call_1","resultMarkdown":"Giá xăng mới nhất đây.\\n\\nBạn có muốn tôi gửi báo cáo này lên Discord không?"',
    );
    expect(body).toContain('data: {"type":"run_done"');
  });

  it("streams Discord tool events with content input and success output", async () => {
    mockResponsesCreate
      .mockResolvedValueOnce({
        output: [
          {
            type: "function_call",
            id: "fc_2",
            call_id: "call_2",
            name: "send_discord_report",
            arguments: JSON.stringify({
              content:
                "Giá xăng dầu mới nhất (00:00 27/03/2026): Xăng RON 95-III 24.330 đ/lít",
            }),
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
                text: "Mình đã gửi thông tin lên Discord.",
              },
            ],
          },
        ],
      });

    mockExecuteFuelTool.mockResolvedValue({
      content: JSON.stringify({
        success: true,
        message: "Gửi tin nhắn thành công (đã tắt link preview)!",
      }),
      resultPreview: "Gửi tin nhắn thành công (đã tắt link preview)!",
    });

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

    const { POST } = await import("@/app/api/fuel-prices/route");
    const request = new Request("http://localhost/api/fuel-prices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            text: "Bạn có muốn tôi gửi báo cáo này lên Discord không?",
          },
          { role: "user", text: "gửi" },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain(
      'data: {"type":"tool_start","toolCallId":"call_2","tool":"send_discord_report","name":"send_discord_message_via_webhook","input":{"content":"Giá xăng dầu mới nhất (00:00 27/03/2026): Xăng RON 95-III 24.330 đ/lít"}',
    );
    expect(body).toContain(
      'data: {"type":"tool_result","toolCallId":"call_2","output":{"success":true,"message":"Gửi tin nhắn thành công (đã tắt link preview)!"},"resultPreview":"Gửi tin nhắn thành công (đã tắt link preview)!"',
    );
  });
});
