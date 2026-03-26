import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dictionary/route";

vi.mock("@/lib/openai/client", () => ({
  openAiClient: {
    responses: {
      create: vi.fn(async () => ({
        output_text: JSON.stringify({
          query: "take off",
          headword: "take off",
          entryType: "phrasal_verb",
          overviewVi: "Một cụm động từ thông dụng.",
          overviewEn: "A common phrasal verb.",
          senses: [
            {
              id: "sense-1",
              label: "Nghĩa 1",
              definitionVi: "Cất cánh",
              definitionEn: "To leave the ground and begin flying.",
              examplesVi: [
                "Máy bay cất cánh đúng giờ.",
                "Chuyến bay cất cánh lúc bình minh.",
                "Tôi nhìn qua cửa sổ khi máy bay cất cánh."
              ],
              patterns: [],
              relatedExpressions: [],
              commonMistakesVi: []
            }
          ]
        }),
      })),
    },
  },
}));

describe("/api/dictionary", () => {
  it("accepts a phrasal verb query", async () => {
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects empty input", async () => {
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects invalid characters", async () => {
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "hello@world" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
