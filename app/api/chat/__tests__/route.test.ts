import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockResponseStream } from "@/test/mocks/openai";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  conversation: {},
  message: {},
}));

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalOpenAiChatModel = process.env.OPENAI_CHAT_MODEL;
const originalOpenAiDictionaryModel = process.env.OPENAI_DICTIONARY_MODEL;
const originalDictionaryCacheTtlMs = process.env.DICTIONARY_CACHE_TTL_MS;
const mockResponsesStream = vi.fn();

function restoreOpenAiEnv() {
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }

  if (originalOpenAiChatModel === undefined) {
    delete process.env.OPENAI_CHAT_MODEL;
  } else {
    process.env.OPENAI_CHAT_MODEL = originalOpenAiChatModel;
  }

  if (originalOpenAiDictionaryModel === undefined) {
    delete process.env.OPENAI_DICTIONARY_MODEL;
  } else {
    process.env.OPENAI_DICTIONARY_MODEL = originalOpenAiDictionaryModel;
  }

  if (originalDictionaryCacheTtlMs === undefined) {
    delete process.env.DICTIONARY_CACHE_TTL_MS;
  } else {
    process.env.DICTIONARY_CACHE_TTL_MS = originalDictionaryCacheTtlMs;
  }
}

beforeEach(() => {
  vi.resetModules();
  mockResponsesStream.mockReset();
  restoreOpenAiEnv();
});

afterEach(() => {
  restoreOpenAiEnv();
  vi.resetModules();
});

describe("openai config", () => {
  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(import("@/lib/openai/config")).rejects.toThrow(
      "Missing OPENAI_API_KEY",
    );
  });

  it("reads the default OpenAI config when OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "test";
    delete process.env.OPENAI_CHAT_MODEL;
    delete process.env.OPENAI_DICTIONARY_MODEL;
    delete process.env.DICTIONARY_CACHE_TTL_MS;

    const { openAiConfig } = await import("@/lib/openai/config");

    expect(openAiConfig.apiKey).toBe("test");
    expect(openAiConfig.chatModel).toBe("openai/gpt-5.4-nano");
  });
});

describe("chat route", () => {
  it("streams assistant events for app-owned chat messages", async () => {
    process.env.OPENAI_API_KEY = "test";
    mockResponsesStream.mockReturnValue(
      createMockResponseStream(["Hello", " there"]),
    );

    vi.doMock("@/lib/openai/client", () => ({
      openAiClient: {
        responses: {
          stream: mockResponsesStream,
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

    const { POST } = await import("@/app/api/chat/route");
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personaId: "simon",
        messages: [
          {
            id: "user-1",
            role: "user",
            text: "Mình muốn luyện nói tiếng Anh.",
          },
          {
            id: "assistant-1",
            role: "assistant",
            text: "Tell me what you want to practice.",
          },
          {
            id: "user-2",
            role: "user",
            text: "Can you fix my sentence?",
          },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/event-stream; charset=utf-8",
    );
    expect(body).toContain('data: {"type":"assistant_start"}');
    expect(body).toContain('data: {"type":"assistant_delta","delta":"Hello"}');
    expect(body).toContain(
      'data: {"type":"assistant_delta","delta":" there"}',
    );
    expect(body).toContain('data: {"type":"assistant_done"}');
    expect(mockResponsesStream).toHaveBeenCalledTimes(1);
    expect(mockResponsesStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        instructions: expect.stringContaining("Simon Hosking"),
        input: [
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Mình muốn luyện nói tiếng Anh.",
              },
            ],
          },
          {
            id: "msg_assistant-1",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: "Tell me what you want to practice.",
                annotations: [],
              },
            ],
          },
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Can you fix my sentence?",
              },
            ],
          },
        ],
      }),
    );
  });
});
