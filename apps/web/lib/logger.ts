import pino from "pino";

/**
 * Structured logger built on Pino.
 *
 * On Vercel: emits JSON to stdout — auto-parsed by Vercel logs (filter by any field).
 * Locally: pretty-printed via pino-pretty for readability.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   const log = logger.child({ route: "listening/dialogue", userId });
 *   log.info({ model, latencyMs, cacheHit }, "dialogue.generated");
 *   log.error({ err }, "dialogue.failed");
 */

const isDev = process.env.NODE_ENV !== "production" && !process.env.VERCEL;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: {
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "*.apiKey",
      "*.api_key",
      "*.authorization",
      "*.password",
      "headers.authorization",
      "headers.cookie",
    ],
    remove: true,
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname,env" },
        },
      }
    : {}),
});

/**
 * Create a route-scoped logger. Adds `route` + a short `requestId` to every log line.
 */
export function routeLogger(route: string, extra?: Record<string, unknown>) {
  const requestId = Math.random().toString(36).slice(2, 10);
  return logger.child({ route, requestId, ...extra });
}
