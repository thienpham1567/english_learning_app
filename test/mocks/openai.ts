export function createMockResponseStream(chunks: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield {
          type: "response.output_text.delta",
          delta: chunk,
        };
      }
    },
  };
}
