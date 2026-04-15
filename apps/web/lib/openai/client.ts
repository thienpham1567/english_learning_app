import OpenAI from "openai";

import { getOpenAiConfig } from "@/lib/openai/config";

function createOpenAiClient() {
  const config = getOpenAiConfig();

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

type OpenAiClient = ReturnType<typeof createOpenAiClient>;

export const openAiClient = new Proxy({} as OpenAiClient, {
  get(_target, prop) {
    const client = createOpenAiClient();
    const value = client[prop as keyof OpenAiClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
