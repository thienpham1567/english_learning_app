import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";

const singleSenseEntry = {
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb" as const,
  phonetic: "/teɪk ˈɒf/",
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  level: "B1" as const,
  register: null,
  overviewVi: "Có nhiều nghĩa thông dụng trong giao tiếp.",
  overviewEn: "A common phrasal verb with multiple senses.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground and begin flying.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      examplesVi: [
        "Máy bay cất cánh đúng giờ.",
        "Chuyến bay cất cánh lúc bình minh.",
        "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh.",
      ],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const multiSenseEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: "/rʌn/",
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  level: "A2" as const,
  register: null,
  overviewVi: "Từ nhiều nghĩa phổ biến.",
  overviewEn: "A very common word with many senses.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy bộ",
      definitionEn: "To move fast on foot.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
    {
      id: "sense-2",
      label: "Nghĩa 2",
      definitionVi: "Vận hành",
      definitionEn: "To operate or manage.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      examplesVi: ["Cô ấy điều hành công ty."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const bilingualEntry = {
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb" as const,
  phonetic: null,
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  level: "B1" as const,
  register: null,
  overviewVi: "Có nhiều nghĩa.",
  overviewEn: "A common phrasal verb.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground and begin flying.",
      usageNoteVi: null,
      examples: [
        { en: "The plane took off on time.", vi: "Máy bay cất cánh đúng giờ." },
        { en: "The rocket took off at dawn.", vi: "Tên lửa cất cánh lúc bình minh." },
        { en: "I always watch when the plane takes off.", vi: "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh." },
      ],
      synonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const synonymEntry = {
  query: "depart",
  headword: "depart",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  level: "B2" as const,
  register: null,
  overviewVi: "Rời đi.",
  overviewEn: "To leave a place.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Rời đi",
      definitionEn: "To leave.",
      usageNoteVi: null,
      examples: [],
      examplesVi: ["Tàu rời đi lúc 9 giờ."],
      synonyms: ["leave", "exit", "go"],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const ipaEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: "/rʌn/",
  phoneticsUs: "/rʌn/",
  phoneticsUk: "/rɑːn/",
  partOfSpeech: "verb",
  level: "A1" as const,
  register: null,
  overviewVi: "Chạy.",
  overviewEn: "To move fast.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy",
      definitionEn: "Move fast on foot.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

describe("DictionaryResultCard", () => {
  it("shows result heading, custom tab buttons, and active sense content", () => {
    const { getByText, getByRole, container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );

    expect(getByText("Kết quả tra cứu")).toBeInTheDocument();
    // Tab is a plain <button>, not an antd tab
    expect(getByRole("button", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
    // No antd card or tabs
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
    expect(container.querySelector(".ant-tabs")).not.toBeInTheDocument();
  });

  it("switches visible sense when a tab button is clicked", () => {
    const { getByRole, getByText, queryByText } = renderUi(
      <DictionaryResultCard vocabulary={multiSenseEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );

    // First sense visible by default
    expect(getByText("Chạy bộ")).toBeInTheDocument();
    expect(queryByText("Vận hành")).not.toBeInTheDocument();

    // Click second tab
    fireEvent.click(getByRole("button", { name: "Nghĩa 2" }));

    expect(getByText("Vận hành")).toBeInTheDocument();
    expect(queryByText("Chạy bộ")).not.toBeInTheDocument();
  });

  it("loading state shows animate-pulse skeleton and no antd card", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched isLoading onSynonymClick={vi.fn()} />,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("pre-search empty state shows simplified BookOpen icon and prompt text", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched={false} isLoading={false} onSynonymClick={vi.fn()} />,
    );

    expect(getByText("Nhập từ cần tra")).toBeInTheDocument();
  });

  it("populated header row wraps to column on phones", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );

    expect(
      container.querySelector(".flex.items-start.justify-between.gap-4"),
    ).toHaveClass("max-[720px]:flex-col");
  });

  it("renders English example text when examples array is populated", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard
        vocabulary={bilingualEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={vi.fn()}
      />,
    );
    expect(getByText("The plane took off on time.")).toBeInTheDocument();
  });

  it("wraps each bilingual example in a cursor-help tooltip span", () => {
    const { container } = renderUi(
      <DictionaryResultCard
        vocabulary={bilingualEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={vi.fn()}
      />,
    );
    const tooltipSpans = container.querySelectorAll("span.cursor-help");
    expect(tooltipSpans).toHaveLength(3);
  });

  it("falls back to examplesVi plain strings when examples is empty", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard
        vocabulary={singleSenseEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={vi.fn()}
      />,
    );
    expect(getByText("Máy bay cất cánh đúng giờ.")).toBeInTheDocument();
  });

  it("renders synonym pills when synonyms array is populated", () => {
    const { getByRole } = renderUi(
      <DictionaryResultCard
        vocabulary={synonymEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={vi.fn()}
      />,
    );
    expect(getByRole("button", { name: "leave" })).toBeInTheDocument();
    expect(getByRole("button", { name: "exit" })).toBeInTheDocument();
    expect(getByRole("button", { name: "go" })).toBeInTheDocument();
  });

  it("calls onSynonymClick with the synonym word when a pill is clicked", () => {
    const onSynonymClick = vi.fn();
    const { getByRole } = renderUi(
      <DictionaryResultCard
        vocabulary={synonymEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={onSynonymClick}
      />,
    );
    fireEvent.click(getByRole("button", { name: "leave" }));
    expect(onSynonymClick).toHaveBeenCalledOnce();
    expect(onSynonymClick).toHaveBeenCalledWith("leave");
  });

  it("does not render synonyms section when synonyms is empty", () => {
    const { queryByText } = renderUi(
      <DictionaryResultCard
        vocabulary={singleSenseEntry}
        hasSearched
        isLoading={false}
        onSynonymClick={vi.fn()}
      />,
    );
    expect(queryByText("Từ đồng nghĩa")).not.toBeInTheDocument();
  });

  it("renders dual US and UK phonetics when phoneticsUs and phoneticsUk are set", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );
    expect(getByText("/rʌn/")).toBeInTheDocument();
    expect(getByText("/rɑːn/")).toBeInTheDocument();
  });

  it("renders POS badge when partOfSpeech is set", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );
    expect(getByText("verb")).toBeInTheDocument();
  });

  it("falls back to single phonetic when phoneticsUs and phoneticsUk are null", () => {
    const { getByText, queryByLabelText } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );
    expect(getByText("/teɪk ˈɒf/")).toBeInTheDocument();
    expect(queryByLabelText("Play US pronunciation")).not.toBeInTheDocument();
  });

  it("audio buttons call speechSynthesis.speak with correct lang", () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: mockSpeak, cancel: mockCancel },
      writable: true,
      configurable: true,
    });
    const mockUtterance = { lang: "", onstart: null as (() => void) | null, onend: null as (() => void) | null, onerror: null as (() => void) | null };
    vi.stubGlobal("SpeechSynthesisUtterance", vi.fn(() => mockUtterance));

    const { getByLabelText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
    );

    fireEvent.click(getByLabelText("Play US pronunciation"));
    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockUtterance.lang).toBe("en-US");

    fireEvent.click(getByLabelText("Play UK pronunciation"));
    expect(mockCancel).toHaveBeenCalled();
    expect(mockUtterance.lang).toBe("en-GB");
  });
});
