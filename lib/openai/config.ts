const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

export const openAiConfig = {
  apiKey,
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
  dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "gpt-4.1-mini",
  dictionaryCacheTtlMs: Number(
    process.env.DICTIONARY_CACHE_TTL_MS ?? 14 * 24 * 60 * 60 * 1000,
  ),
};
