import type { SseEventPayload } from "@/lib/fuel-prices/types";

/**
 * Encodes and enqueues an SSE event onto a ReadableStream controller.
 */
export function writeSseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  payload: SseEventPayload,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

/**
 * Streams a long text in small chunks with a typewriter delay.
 */
export async function streamTextChunks(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  text: string,
  chunkSize = 8,
  delayMs = 15,
) {
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    writeSseEvent(controller, encoder, {
      type: "assistant_delta",
      delta: chunk,
    });
    if (i + chunkSize < text.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
