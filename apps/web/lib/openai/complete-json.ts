import type OpenAI from "openai";
import type { z } from "zod";

import { openAiClient } from "@/lib/openai/client";
import { extractJson } from "@/lib/openai/extract-json";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/**
 * Error thrown when an LLM-JSON completion cannot be turned into the expected
 * shape. Routes can catch this and map it to a 502 without leaking internals.
 */
export class LlmJsonError extends Error {
  /** Coarse cause, useful for logging/branching. */
  readonly kind: "empty" | "parse" | "schema";
  /** Raw model output (truncated), kept for log context — never returned to clients. */
  readonly raw?: string;

  constructor(kind: LlmJsonError["kind"], message: string, raw?: string) {
    super(message);
    this.name = "LlmJsonError";
    this.kind = kind;
    this.raw = raw?.slice(0, 2000);
  }
}

export type CompleteJsonOptions<T> = {
  /** Model id — pass an `openAiConfig` field (e.g. `openAiConfig.chatModel`). */
  model: string;
  /** Stable role/instructions. Becomes the `system` message when provided. */
  system?: string;
  /** The per-request payload. Becomes the `user` message. */
  user?: string;
  /**
   * Full message list. Use instead of `system`/`user` for multi-turn prompts.
   * When provided, `system`/`user` are ignored.
   */
  messages?: ChatMessage[];
  /**
   * Zod schema. When provided the parsed JSON is validated and the typed value
   * is returned; otherwise the raw parsed `unknown` is returned.
   */
  schema?: z.ZodType<T>;
  /** Defaults to 0.4 — a neutral mid-point; override per task (see PROMPT_TEMPERATURE). */
  temperature?: number;
  /** Optional output cap. Omit to use the model/provider default. */
  maxTokens?: number;
  signal?: AbortSignal;
};

function toMessages<T>(opts: CompleteJsonOptions<T>): ChatMessage[] {
  if (opts.messages) return opts.messages;
  const messages: ChatMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user ?? "" });
  return messages;
}

/**
 * One pipeline for every JSON-returning LLM call:
 *   create() → pull content → extractJson() → (optional) Zod validate.
 *
 * Replaces the scattered `JSON.parse` / hand-rolled brace-matching across routes.
 * Always sets `response_format: json_object`; tolerant `extractJson` still runs
 * because some upstream models ignore that flag.
 */
export async function completeJson<T = unknown>(opts: CompleteJsonOptions<T>): Promise<T> {
  const completion = await openAiClient.chat.completions.create(
    {
      model: opts.model,
      temperature: opts.temperature ?? 0.4,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      response_format: { type: "json_object" },
      messages: toMessages(opts),
    },
    opts.signal ? { signal: opts.signal } : undefined,
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new LlmJsonError("empty", "Model returned no content");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch (err) {
    throw new LlmJsonError("parse", `Could not extract JSON: ${(err as Error).message}`, content);
  }

  if (!opts.schema) return parsed as T;

  const result = opts.schema.safeParse(parsed);
  if (!result.success) {
    throw new LlmJsonError(
      "schema",
      `Output failed schema validation: ${result.error.message}`,
      content,
    );
  }
  return result.data;
}
