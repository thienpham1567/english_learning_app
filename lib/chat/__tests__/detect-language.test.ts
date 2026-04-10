import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/lib/chat/detect-language";

describe("detectLanguage", () => {
  it("returns english for an english message", () => {
    expect(detectLanguage("I want to practice speaking every day.")).toBe("english");
  });

  it("returns english for a short common english reply", () => {
    expect(detectLanguage("Can you help me?")).toBe("english");
  });

  it("returns english for another short common english reply", () => {
    expect(detectLanguage("No problem")).toBe("english");
  });

  it("returns english for a factual English sentence with Vietnam in it", () => {
    expect(detectLanguage("I am from Vietnam")).toBe("english");
  });

  it("returns english for a minimal English thanks message", () => {
    expect(detectLanguage("Thanks")).toBe("english");
  });

  it("returns english for an ordinary sentence containing the", () => {
    expect(detectLanguage("What is the problem?")).toBe("english");
  });

  it("returns english for another ordinary sentence containing the", () => {
    expect(detectLanguage("Can you explain the sentence?")).toBe("english");
  });

  it("returns english for an ordinary sentence with a weak Vietnamese-looking token", () => {
    expect(detectLanguage("I want to ban this word")).toBe("english");
  });

  it("returns english for an ordinary sentence with LA as a token", () => {
    expect(detectLanguage("We went to LA yesterday")).toBe("english");
  });

  it("returns english for an ordinary sentence with co founder", () => {
    expect(detectLanguage("Our co founder can help")).toBe("english");
  });

  it("returns english for a question request", () => {
    expect(detectLanguage("Can I ask a question?")).toBe("english");
  });

  it("returns english for a polite request to explain a word", () => {
    expect(detectLanguage("Please explain this word")).toBe("english");
  });

  it("returns english for a greeting", () => {
    expect(detectLanguage("Hello teacher")).toBe("english");
  });

  it("returns english for a morning greeting", () => {
    expect(detectLanguage("Good morning")).toBe("english");
  });

  it("returns english for an ordinary sentence with Lam as a name", () => {
    expect(detectLanguage("Lam will join the meeting")).toBe("english");
  });

  it("returns english for an ordinary sentence with Minh as a name", () => {
    expect(detectLanguage("Minh can help")).toBe("english");
  });

  it("returns english for an ordinary sentence with Viet as a name", () => {
    expect(detectLanguage("Viet will join the meeting")).toBe("english");
  });

  it("returns english for an ordinary sentence with Anh as a name", () => {
    expect(detectLanguage("Anh can speak English")).toBe("english");
  });

  it("returns english for two Vietnamese-looking name tokens", () => {
    expect(detectLanguage("Viet Anh will join the meeting")).toBe("english");
  });

  it("returns english for two Vietnamese-looking name tokens with English words", () => {
    expect(detectLanguage("Minh Anh can help")).toBe("english");
  });

  it("returns english for two Vietnamese-looking name tokens and a meeting sentence", () => {
    expect(detectLanguage("Minh Viet will join the meeting")).toBe("english");
  });

  it("returns vietnamese for a clearly Vietnamese message", () => {
    expect(detectLanguage("Mình muốn hỏi về cách dùng thì hiện tại đơn.")).toBe("vietnamese");
  });

  it("returns vietnamese for a simple Vietnamese sentence with cần giúp", () => {
    expect(detectLanguage("Tôi cần giúp")).toBe("vietnamese");
  });

  it("returns vietnamese for a simple Vietnamese sentence with cần học", () => {
    expect(detectLanguage("Tôi cần học")).toBe("vietnamese");
  });

  it("returns vietnamese for a simple Vietnamese sentence with Mình cần giúp", () => {
    expect(detectLanguage("Mình cần giúp")).toBe("vietnamese");
  });

  it("returns vietnamese for a short Vietnamese request", () => {
    expect(detectLanguage("Cần giúp")).toBe("vietnamese");
  });

  it("returns vietnamese for a Vietnamese greeting", () => {
    expect(detectLanguage("Xin chao")).toBe("vietnamese");
  });

  it("returns vietnamese for a Vietnamese thanks message", () => {
    expect(detectLanguage("Cam on")).toBe("vietnamese");
  });

  it("returns vietnamese for a Vietnamese identity sentence", () => {
    expect(detectLanguage("minh la giao vien")).toBe("vietnamese");
  });

  it("returns vietnamese for a definition question", () => {
    expect(detectLanguage("Đây là gì")).toBe("vietnamese");
  });

  it("returns vietnamese for a simple admission of not understanding", () => {
    expect(detectLanguage("Em chưa hiểu")).toBe("vietnamese");
  });

  it("returns vietnamese for unaccented Vietnamese input", () => {
    expect(detectLanguage("co the giai thich khong")).toBe("vietnamese");
  });

  it("does not treat an English phrase containing co and the as Vietnamese", () => {
    expect(detectLanguage("eco therapy")).toBe("unknown");
  });

  it("returns vietnamese for a short accented Vietnamese word starting with đ", () => {
    expect(detectLanguage("đi")).toBe("vietnamese");
  });

  it("returns vietnamese for an accented Vietnamese phrase starting with Đ", () => {
    expect(detectLanguage("Đi nào")).toBe("vietnamese");
  });

  it("returns vietnamese for an accented Vietnamese word starting with Đ", () => {
    expect(detectLanguage("Được")).toBe("vietnamese");
  });

  it("returns vietnamese for an accented Vietnamese phrase starting with Đ and another word", () => {
    expect(detectLanguage("Đúng rồi")).toBe("vietnamese");
  });

  it("returns vietnamese for a short unaccented Vietnamese phrase", () => {
    expect(detectLanguage("la ban")).toBe("vietnamese");
  });

  it("returns vietnamese for a longer unaccented Vietnamese request", () => {
    expect(detectLanguage("toi muon hoc tieng anh")).toBe("vietnamese");
  });

  it("returns mixed for a bilingual message", () => {
    expect(detectLanguage("Cô ơi, what does this sentence mean?")).toBe("mixed");
  });
});
