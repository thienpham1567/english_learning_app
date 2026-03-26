import { describe, expect, it } from "vitest";
import { createDictionaryCache } from "@/lib/dictionary/cache";

describe("dictionary cache", () => {
  it("returns a cached value before ttl expiry", () => {
    const cache = createDictionaryCache(() => 1000);
    cache.set("take off", { headword: "take off" });

    expect(cache.get("take off")).toEqual({ headword: "take off" });
  });

  it("returns null for a cache miss", () => {
    const cache = createDictionaryCache(() => 1000);
    expect(cache.get("unknown")).toBeNull();
  });

  it("returns null for an expired entry", () => {
    let now = 1000;
    const cache = createDictionaryCache(() => now);
    cache.set("take off", { headword: "take off" }, 100);

    now = 1200;
    expect(cache.get("take off")).toBeNull();
  });
});
