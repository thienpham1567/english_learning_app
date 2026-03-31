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
  it("streams agent and tool lifecycle events before the final assistant response", async () => {
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

    mockExecuteFuelTool.mockResolvedValue(
      JSON.stringify({
        success: true,
        prices: [{ name: "Xăng RON 95-III", price: "24.332" }],
      }),
    );

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
    expect(body).toContain('data: {"type":"assistant_start"}');
    expect(body).toContain(
      'data: {"type":"agent_start","agentId":"agent-get_fuel_prices-1","name":"Trợ lý giá xăng","summary":"Phân tích yêu cầu tra cứu giá mới nhất"',
    );
    expect(body).toContain(
      'data: {"type":"tool_call","toolCallId":"call_1","agentId":"agent-get_fuel_prices-1","name":"Lấy giá mới nhất","tool":"get_fuel_prices","summary":"Lấy bảng giá mới nhất từ PVOIL","params":{}',
    );
    expect(body).toContain(
      'data: {"type":"tool_result","toolCallId":"call_1","agentId":"agent-get_fuel_prices-1","name":"Lấy giá mới nhất","tool":"get_fuel_prices","resultPreview":"1 loại nhiên liệu đã được cập nhật."',
    );
    expect(body).toContain(
      'data: {"type":"agent_done","agentId":"agent-get_fuel_prices-1","resultPreview":"Đã sẵn sàng tổng hợp bảng giá xăng dầu."',
    );
    expect(body).toContain('data: {"type":"assistant_delta","delta":"| Xăng R"}');
    expect(body).toContain('data: {"type":"assistant_done"}');
  });
});
