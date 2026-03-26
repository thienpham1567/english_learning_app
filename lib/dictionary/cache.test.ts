import { describe, expect, it } from "vitest";
import { createDictionaryCache } from "@/lib/dictionary/cache";

describe("dictionary cache", () => {
  it("returns a cached value before ttl expiry", () => {
    const cache = createDictionaryCache(() => 1000);
    cache.set("take off", { headword: "take off" });

    expect(cache.get("take off")).toEqual({ headword: "take off" });
  });
});
