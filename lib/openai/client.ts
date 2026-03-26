import OpenAI from "openai";

import { openAiConfig } from "@/lib/openai/config";

export const openAiClient = new OpenAI({
  apiKey: openAiConfig.apiKey,
});
