/**
 * Parses the Server-Sent-Event stream produced by /api/chat.
 *
 * - Buffers incomplete chunks across `reader.read()` calls.
 * - Wraps JSON.parse in try/catch so a single malformed event can't crash the
 *   whole stream.
 * - Honors an AbortSignal so the caller can cancel mid-stream.
 */
export type AssistantStreamEvent =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string }
  | { type: "assistant_persist_error"; message: string };

export type StreamCallbacks = {
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onPersistError?: (message: string) => void;
};

function parseSsePayloads(chunk: string): string[] {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

export async function parseAssistantStream(
  response: Response,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) throw new Error("Response has no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const onAbort = () => {
    finished = true;
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort);

  try {
    while (!finished) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let eventBoundary = buffer.indexOf("\n\n");

      while (eventBoundary !== -1) {
        const rawEvent = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        for (const payload of parseSsePayloads(rawEvent)) {
          let event: AssistantStreamEvent;
          try {
            event = JSON.parse(payload) as AssistantStreamEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "assistant_delta":
              if (event.delta) callbacks.onDelta(event.delta);
              break;
            case "assistant_error":
              callbacks.onError(event.message);
              finished = true;
              break;
            case "assistant_persist_error":
              callbacks.onPersistError?.(event.message);
              break;
            case "assistant_done":
              callbacks.onDone();
              finished = true;
              break;
            case "assistant_start":
              break;
          }
        }

        eventBoundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
