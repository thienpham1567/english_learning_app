import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, "../..");

const filesThatShouldUseHttpClient = [
  "app/(app)/dictionary/page.tsx",
  "app/(app)/my-vocabulary/page.tsx",
  "components/app/VocabularyDetailSheet.tsx",
  "components/dictionary/DictionarySearchPanel.tsx",
] as const;

async function readSource(relativePath: string) {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

describe("http client usage", () => {
  it.each(filesThatShouldUseHttpClient)(
    "routes %s through the shared axios client instead of fetch",
    async (relativePath) => {
      const source = await readSource(relativePath);

      expect(source).not.toMatch(/\bfetch\s*\(/);
      expect(source).toContain('from "@/lib/http"');
    },
  );

  it("keeps fetch only for the streaming chat request", async () => {
    const source = await readSource("components/app/ChatWindow.tsx");
    const fetchCalls = [...source.matchAll(/\bfetch\s*\(/g)];

    expect(fetchCalls).toHaveLength(1);
    expect(source).toContain('await fetch("/api/chat"');
    expect(source).toContain('from "@/lib/http"');
  });
});
