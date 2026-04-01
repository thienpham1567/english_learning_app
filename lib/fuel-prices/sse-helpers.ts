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
