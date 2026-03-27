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
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "openai/gpt-5.4-nano",
  dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "openai/gpt-5.4-nano",
  dictionaryCacheTtlMs: parseDictionaryCacheTtlMs(
    process.env.DICTIONARY_CACHE_TTL_MS,
  ),
};
