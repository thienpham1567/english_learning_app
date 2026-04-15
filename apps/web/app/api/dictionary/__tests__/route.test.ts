import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ saved: false }]),
        })),
      })),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/openai/client", () => ({
  openAiClient: {
    responses: {
      create: vi.fn(async () => ({
        output_text: JSON.stringify({
          query: "take off",
          headword: "take off",
          entryType: "phrasal_verb",
          phonetic: null,
          phoneticsUs: "/teɪk ɒf/",
          phoneticsUk: "/teɪk ɒf/",
          partOfSpeech: "phrasal verb",
          level: null,
          register: null,
          verbForms: null,
          numberInfo: null,
          overviewVi: "Một cụm động từ thông dụng.",
          overviewEn: "A common phrasal verb.",
          senses: [
            {
              id: "sense-1",
              label: "Nghĩa 1",
              definitionVi: "Cất cánh",
              definitionEn: "To leave the ground and begin flying.",
              usageNoteVi: null,
              examplesVi: [
                "Máy bay cất cánh đúng giờ.",
                "Chuyến bay cất cánh lúc bình minh.",
                "Tôi nhìn qua cửa sổ khi máy bay cất cánh.",
              ],
              examples: [],
              synonyms: [],
              patterns: [],
              relatedExpressions: [],
              commonMistakesVi: [],
            },
          ],
        }),
      })),
    },
  },
}));

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

function restoreOpenAiEnv() {
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
}

beforeEach(() => {
  vi.resetModules();
  process.env.OPENAI_API_KEY = "test";
});

afterEach(() => {
  restoreOpenAiEnv();
  vi.resetModules();
});

describe("/api/dictionary", () => {
  it("accepts a phrasal verb query and returns data with cached:false", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data.headword", "take off");
    expect(body).toHaveProperty("cached", false);
  }, 10000);

  it("rejects empty input", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects invalid characters", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "hello@world" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns cached:true when a cache hit exists", async () => {
    const { db } = await import("@/lib/db");
    const cachedData = {
      query: "take off",
      headword: "take off",
      entryType: "phrasal_verb",
      phonetic: null,
      phoneticsUs: null,
      phoneticsUk: null,
      partOfSpeech: null,
      level: null,
      register: null,
      verbForms: null,
      numberInfo: null,
      overviewVi: "Một cụm động từ thông dụng.",
      overviewEn: "A common phrasal verb.",
      senses: [
        {
          id: "sense-1",
          label: "Nghĩa 1",
          definitionVi: "Cất cánh",
          definitionEn: "To leave the ground and begin flying.",
          usageNoteVi: null,
          examplesVi: [
            "Máy bay cất cánh đúng giờ.",
            "Chuyến bay cất cánh lúc bình minh.",
            "Tôi nhìn qua cửa sổ khi máy bay cất cánh.",
          ],
          patterns: [],
          relatedExpressions: [],
          commonMistakesVi: [],
        },
      ],
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ data: cachedData }]),
        })),
      })),
    } as unknown as ReturnType<typeof db.select>);

    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("cached", true);
    expect(body).toHaveProperty("data.headword", "take off");
  });

  it("normalizes legacy cached collocation entries to word on cache hit", async () => {
    const { db } = await import("@/lib/db");
    const cachedData = {
      query: "strong coffee",
      headword: "strong coffee",
      entryType: "collocation",
      phonetic: null,
      phoneticsUs: null,
      phoneticsUk: null,
      partOfSpeech: "noun phrase",
      level: "A2",
      register: null,
      verbForms: null,
      numberInfo: null,
      overviewVi: "Một cụm từ tự nhiên.",
      overviewEn: "A natural phrase.",
      senses: [
        {
          id: "sense-1",
          label: "Nghĩa 1",
          definitionVi: "Cà phê đậm",
          definitionEn: "Coffee with a strong taste.",
          usageNoteVi: null,
          examplesVi: ["Tôi gọi một ly cà phê đậm."],
          examples: [],
          collocations: [],
          synonyms: [],
          antonyms: [],
          patterns: [],
          relatedExpressions: [],
          commonMistakesVi: [],
        },
      ],
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ data: cachedData }]),
        })),
      })),
    } as unknown as ReturnType<typeof db.select>);

    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "strong coffee" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("cached", true);
    expect(body).toHaveProperty("data.entryType", "word");
  });

  it("returns phoneticsUs, phoneticsUk, and partOfSpeech in the response data", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty("phoneticsUs", "/teɪk ɒf/");
    expect(body.data).toHaveProperty("phoneticsUk", "/teɪk ɒf/");
    expect(body.data).toHaveProperty("partOfSpeech", "phrasal verb");
  });
});
