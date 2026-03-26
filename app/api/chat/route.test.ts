import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalOpenAiChatModel = process.env.OPENAI_CHAT_MODEL;
const originalOpenAiDictionaryModel = process.env.OPENAI_DICTIONARY_MODEL;
const originalDictionaryCacheTtlMs = process.env.DICTIONARY_CACHE_TTL_MS;

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
    expect(openAiConfig.chatModel).toBe("gpt-4.1-mini");
  });
});
