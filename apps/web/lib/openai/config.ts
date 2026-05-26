const defaultDictionaryCacheTtlMs = 14 * 24 * 60 * 60 * 1000;

type OpenAiConfig = {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  dictionaryModel: string;
  listeningModel: string;
  dictionaryCacheTtlMs: number;
};

function parseDictionaryCacheTtlMs(value: string | undefined) {
  if (value === undefined) {
    return defaultDictionaryCacheTtlMs;
  }

  const ttlMs = Number(value);

  if (!Number.isFinite(ttlMs)) {
    throw new Error("Invalid DICTIONARY_CACHE_TTL_MS");
  }

  return ttlMs;
}

export function getOpenAiConfig(): OpenAiConfig {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
    chatModel: process.env.OPENAI_CHAT_MODEL ?? "google/gemini-3.1-flash-lite-preview",
    dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "google/gemini-3.1-flash-lite-preview",
    listeningModel: process.env.OPENAI_LISTENING_MODEL ?? "google/gemini-2.5-flash",
    dictionaryCacheTtlMs: parseDictionaryCacheTtlMs(process.env.DICTIONARY_CACHE_TTL_MS),
  };
}

export const openAiConfig = new Proxy({} as OpenAiConfig, {
  get(_target, prop) {
    return getOpenAiConfig()[prop as keyof OpenAiConfig];
  },
});
