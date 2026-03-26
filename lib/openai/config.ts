const apiKey = process.env.OPENAI_API_KEY;
const defaultDictionaryCacheTtlMs = 14 * 24 * 60 * 60 * 1000;

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

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

export const openAiConfig = {
  apiKey,
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
  dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "gpt-4.1-mini",
  dictionaryCacheTtlMs: parseDictionaryCacheTtlMs(
    process.env.DICTIONARY_CACHE_TTL_MS,
  ),
};
