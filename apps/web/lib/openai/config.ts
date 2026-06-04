const defaultDictionaryCacheTtlMs = 14 * 24 * 60 * 60 * 1000;

type OpenAiConfig = {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  dictionaryModel: string;
  listeningModel: string;
  smartReaderModel: string;
  dictionaryCacheTtlMs: number;
  /**
   * Task-oriented model registry. Lets us point graders at a stronger model and
   * bulk generators at a cheaper one without touching call sites. Each entry
   * falls back to `chatModel` when its env var is unset, so existing behaviour
   * is preserved until the per-task envs are configured.
   */
  models: {
    /** Scoring / evaluation (writing & speaking graders, rubric scoring). */
    grader: string;
    /** Bulk content/exercise generation (flashcards, quizzes, passages). */
    generator: string;
    /** Coaching/feedback prose (weekly report, explanations). */
    coach: string;
  };
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

  const chatModel = process.env.OPENAI_CHAT_MODEL ?? "deepseek/deepseek-v4-pro";

  return {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
    chatModel,
    dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "deepseek/deepseek-v4-pro",
    listeningModel: process.env.OPENAI_LISTENING_MODEL ?? "deepseek/deepseek-v4-pro",
    smartReaderModel: process.env.OPENAI_SMART_READER_MODEL ?? "deepseek/deepseek-v4-pro",
    dictionaryCacheTtlMs: parseDictionaryCacheTtlMs(process.env.DICTIONARY_CACHE_TTL_MS),
    models: {
      grader: process.env.OPENAI_GRADER_MODEL ?? chatModel,
      generator: process.env.OPENAI_GENERATOR_MODEL ?? chatModel,
      coach: process.env.OPENAI_COACH_MODEL ?? chatModel,
    },
  };
}

export const openAiConfig = new Proxy({} as OpenAiConfig, {
  get(_target, prop) {
    return getOpenAiConfig()[prop as keyof OpenAiConfig];
  },
});
