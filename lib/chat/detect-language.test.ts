import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/lib/chat/detect-language";

describe("detectLanguage", () => {
  it("returns english for an english message", () => {
    expect(detectLanguage("I want to practice speaking every day.")).toBe(
      "english",
    );
  });

  it("returns english for a short common english reply", () => {
    expect(detectLanguage("Can you help me?")).toBe("english");
  });

  it("returns vietnamese for a clearly Vietnamese message", () => {
    expect(
      detectLanguage("Mình muốn hỏi về cách dùng thì hiện tại đơn."),
    ).toBe("vietnamese");
  });

  it("returns vietnamese for unaccented Vietnamese input", () => {
    expect(detectLanguage("co the giai thich khong")).toBe("vietnamese");
  });

  it("returns mixed for a bilingual message", () => {
    expect(detectLanguage("Cô ơi, what does this sentence mean?")).toBe(
      "mixed",
    );
  });
});
