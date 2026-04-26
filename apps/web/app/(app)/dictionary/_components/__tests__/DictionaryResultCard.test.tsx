import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";

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
  verbForms: null,
  overviewVi: "Có nhiều nghĩa thông dụng trong giao tiếp.",
  overviewEn: "A common phrasal verb with multiple senses.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground and begin flying.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      examplesVi: [
        "Máy bay cất cánh đúng giờ.",
        "Chuyến bay cất cánh lúc bình minh.",
        "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh.",
      ],
      antonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
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
  verbForms: null,
  overviewVi: "Từ nhiều nghĩa phổ biến.",
  overviewEn: "A very common word with many senses.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy bộ",
      definitionEn: "To move fast on foot.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [
        { en: "run a company", vi: "điều hành một công ty" },
        { en: "run out of time", vi: "hết thời gian" },
      ],
    },
    {
      id: "sense-2",
      label: "Nghĩa 2",
      definitionVi: "Vận hành",
      definitionEn: "To operate or manage.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: ["Cô ấy điều hành công ty."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
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
  verbForms: null,
  overviewVi: "Có nhiều nghĩa.",
  overviewEn: "A common phrasal verb.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground and begin flying.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [
        { en: "The plane took off on time.", vi: "Máy bay cất cánh đúng giờ." },
        { en: "The rocket took off at dawn.", vi: "Tên lửa cất cánh lúc bình minh." },
        {
          en: "I always watch when the plane takes off.",
          vi: "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh.",
        },
      ],
      synonyms: [],
      antonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
    },
  ],
};

const _synonymEntry = {
  query: "depart",
  headword: "depart",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  level: "B2" as const,
  register: null,
  verbForms: null,
  overviewVi: "Rời đi.",
  overviewEn: "To leave a place.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Rời đi",
      definitionEn: "To leave.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      examplesVi: ["Tàu rời đi lúc 9 giờ."],
      synonyms: ["leave", "exit", "go"],
      antonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
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
  verbForms: null,
  overviewVi: "Chạy.",
  overviewEn: "To move fast.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy",
      definitionEn: "Move fast on foot.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
    },
  ],
};

const verbEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/rʌn/",
  phoneticsUk: "/rɑːn/",
  partOfSpeech: "verb",
  level: "A1" as const,
  register: null,
  overviewVi: "Chạy.",
  overviewEn: "To move fast.",
  nearbyWords: ["rum", "rump", "rune", "rung"],
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  verbForms: [
    { label: "Base", form: "run", phoneticsUs: null, phoneticsUk: null, isIrregular: false },
    { label: "3rd person", form: "runs", phoneticsUs: null, phoneticsUk: null, isIrregular: false },
    { label: "Past simple", form: "ran", phoneticsUs: null, phoneticsUk: null, isIrregular: true },
    {
      label: "Past participle",
      form: "run",
      phoneticsUs: null,
      phoneticsUk: null,
      isIrregular: true,
    },
    {
      label: "Present participle",
      form: "running",
      phoneticsUs: null,
      phoneticsUk: null,
      isIrregular: false,
    },
  ],
  numberInfo: null,
  senses: [
    {
      id: "s1",
      label: "Nghĩa 1",
      definitionVi: "Chạy",
      definitionEn: "Move fast on foot.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [{ en: "She **ran** every day.", vi: "Cô ấy chạy mỗi ngày." }],
      synonyms: [],
      antonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [{ en: "**go** for a run", vi: "đi chạy bộ" }],
    },
  ],
};

const nounEntry = {
  query: "child",
  headword: "child",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/tʃaɪld/",
  phoneticsUk: "/tʃaɪld/",
  partOfSpeech: "noun",
  level: "A1" as const,
  register: "formal",
  overviewVi: "Đứa trẻ.",
  overviewEn: "A young person.",
  nearbyWords: [],
  verbForms: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  numberInfo: {
    plural: "children",
    isUncountable: false,
    isPluralOnly: false,
    isSingularOnly: false,
  },
  senses: [
    {
      id: "s1",
      label: "Nghĩa 1",
      definitionVi: "Đứa trẻ",
      definitionEn: "A young person.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
    },
  ],
};

const multiWordWordEntry = {
  query: "strong coffee",
  headword: "strong coffee",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: "noun phrase",
  level: "A2" as const,
  register: null,
  verbForms: null,
  overviewVi: "Một cụm từ thông dụng.",
  overviewEn: "A common phrase.",
  nearbyWords: [],
  numberInfo: null,
  frequencyBand: null,
  wordFamily: null,
  isNotEnglish: false,
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cà phê đậm",
      definitionEn: "Coffee with a strong taste.",
      usageNoteVi: null,
      shortMeaningsVi: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: ["Tôi thích cà phê đậm vào buổi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
    },
  ],
};

const frequencyEntry = {
  ...ipaEntry,
  frequencyBand: "top1k" as const,
  wordFamily: null,
};

const _wordFamilyEntry = {
  ...verbEntry,
  wordFamily: [
    { pos: "noun", words: ["runner", "running"] },
    { pos: "adjective", words: ["runny"] },
  ],
};

const manyCollocationsEntry = {
  ...multiSenseEntry,
  senses: [
    {
      ...multiSenseEntry.senses[0],
      collocations: [
        { en: "run a company", vi: "điều hành một công ty" },
        { en: "run out of time", vi: "hết thời gian" },
        { en: "run a risk", vi: "chấp nhận rủi ro" },
        { en: "run a marathon", vi: "chạy marathon" },
      ],
    },
    multiSenseEntry.senses[1],
  ],
};

describe("FrequencyBar", () => {
  it("renders frequency segments when frequencyBand is set", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={frequencyEntry} hasSearched isLoading={false} />,
    );
    const segments = container.querySelectorAll("[data-frequency-segment]");
    expect(segments).toHaveLength(5);
  });

  it("marks correct number of segments as filled for top1k", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={frequencyEntry} hasSearched isLoading={false} />,
    );
    const filled = container.querySelectorAll("[data-frequency-segment='filled']");
    expect(filled).toHaveLength(5);
  });

  it("renders the Vietnamese frequency label", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={frequencyEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("Rất phổ biến")).toBeInTheDocument();
  });

  it("does not render FrequencyBar when frequencyBand is null", () => {
    const { queryByText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} />,
    );
    expect(queryByText("Rất phổ biến")).not.toBeInTheDocument();
    expect(queryByText("Phổ biến")).not.toBeInTheDocument();
  });

  it("renders correct filled count for top3k (4 filled)", () => {
    const entry = { ...ipaEntry, frequencyBand: "top3k" as const };
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={entry} hasSearched isLoading={false} />,
    );
    const filled = container.querySelectorAll("[data-frequency-segment='filled']");
    const empty = container.querySelectorAll("[data-frequency-segment='empty']");
    expect(filled).toHaveLength(4);
    expect(empty).toHaveLength(1);
  });
});

describe("DictionaryResultCard", () => {
  it("shows result heading, custom tab buttons, and active sense content", () => {
    const { getByText, getByRole, container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
    );

    expect(getByText("Kết quả tra cứu")).toBeInTheDocument();
    // Tab is a plain <button>, not an antd tab
    expect(getByRole("button", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
    // No antd card or tabs
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
    expect(container.querySelector(".ant-tabs")).not.toBeInTheDocument();
  });

  it("uses a generic label for word entries so multi-word headwords are not shown as single words", () => {
    renderUi(
      <DictionaryResultCard vocabulary={multiWordWordEntry} hasSearched isLoading={false} />,
    );

    expect(screen.getByText("Từ / cụm từ")).toBeInTheDocument();
    expect(screen.queryByText("Từ đơn")).not.toBeInTheDocument();
  });

  it("shows collocations inline without a toggle when there are 3 or fewer", () => {
    const { getByText, queryByRole } = renderUi(
      <DictionaryResultCard vocabulary={multiSenseEntry} hasSearched isLoading={false} />,
    );
    // Both collocations visible immediately
    expect(getByText("run a company")).toBeInTheDocument();
    expect(getByText("điều hành một công ty")).toBeInTheDocument();
    expect(getByText("run out of time")).toBeInTheDocument();
    // No expand button needed
    expect(queryByRole("button", { name: /Xem thêm/i })).not.toBeInTheDocument();
  });

  it("shows first 3 collocations inline and hides rest behind Xem thêm when more than 3", () => {
    const { getByText, queryByText, getByRole } = renderUi(
      <DictionaryResultCard vocabulary={manyCollocationsEntry} hasSearched isLoading={false} />,
    );
    // First 3 visible
    expect(getByText("run a company")).toBeInTheDocument();
    expect(getByText("run out of time")).toBeInTheDocument();
    expect(getByText("run a risk")).toBeInTheDocument();
    // 4th hidden
    expect(queryByText("run a marathon")).not.toBeInTheDocument();
    // Expand button shows count
    expect(getByRole("button", { name: /Xem thêm \(1\)/i })).toBeInTheDocument();
  });

  it("expands remaining collocations when Xem thêm is clicked", () => {
    const { getByText, getByRole } = renderUi(
      <DictionaryResultCard vocabulary={manyCollocationsEntry} hasSearched isLoading={false} />,
    );
    fireEvent.click(getByRole("button", { name: /Xem thêm \(1\)/i }));
    expect(getByText("run a marathon")).toBeInTheDocument();
    expect(getByText("chạy marathon")).toBeInTheDocument();
  });

  it("resets the collocations toggle when switching senses away and back", () => {
    const { getByText, queryByText, getByRole } = renderUi(
      <DictionaryResultCard vocabulary={manyCollocationsEntry} hasSearched isLoading={false} />,
    );
    // Expand
    fireEvent.click(getByRole("button", { name: /Xem thêm \(1\)/i }));
    expect(getByText("run a marathon")).toBeInTheDocument();
    // Switch to sense 2
    fireEvent.click(getByRole("button", { name: "Nghĩa 2" }));
    // Switch back to sense 1
    fireEvent.click(getByRole("button", { name: "Nghĩa 1" }));
    // 4th collocation should be hidden again
    expect(queryByText("run a marathon")).not.toBeInTheDocument();
    expect(getByRole("button", { name: /Xem thêm \(1\)/i })).toBeInTheDocument();
  });

  it("switches visible sense when a tab button is clicked", () => {
    const { getByRole, getByText, queryByText } = renderUi(
      <DictionaryResultCard vocabulary={multiSenseEntry} hasSearched isLoading={false} />,
    );

    // First sense visible by default
    expect(getByText("Chạy bộ")).toBeInTheDocument();
    expect(queryByText("Vận hành")).not.toBeInTheDocument();

    // Click second tab
    fireEvent.click(getByRole("button", { name: "Nghĩa 2" }));

    expect(getByText("Vận hành")).toBeInTheDocument();
    expect(queryByText("Chạy bộ")).not.toBeInTheDocument();
    expect(queryByText("Collocations (2)")).not.toBeInTheDocument();
  });

  it("loading state shows animate-pulse skeleton and no antd card", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched isLoading />,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("pre-search empty state shows simplified BookOpen icon and prompt text", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched={false} isLoading={false} />,
    );

    expect(getByText("Nhập từ cần tra")).toBeInTheDocument();
  });

  it("populated header row wraps to column on phones", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
    );

    expect(container.querySelector(".flex.items-start.justify-between.gap-4")).toHaveClass(
      "max-[720px]:flex-col",
    );
  });

  it("renders English example text when examples array is populated", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={bilingualEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("The plane took off on time.")).toBeInTheDocument();
  });

  it("shows Vietnamese translation inline below each English example", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={bilingualEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("The plane took off on time.")).toBeInTheDocument();
    expect(getByText("Máy bay cất cánh đúng giờ.")).toBeInTheDocument();
    expect(getByText("The rocket took off at dawn.")).toBeInTheDocument();
    expect(getByText("Tên lửa cất cánh lúc bình minh.")).toBeInTheDocument();
  });

  it("does not render cursor-help tooltip spans for examples", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={bilingualEntry} hasSearched isLoading={false} />,
    );
    const tooltipSpans = container.querySelectorAll("[style*='cursor: help']");
    expect(tooltipSpans).toHaveLength(0);
  });

  it("falls back to examplesVi plain strings when examples is empty", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("Máy bay cất cánh đúng giờ.")).toBeInTheDocument();
  });

  it("renders Thesaurus button when vocabulary is present and calls onOpenThesaurus on click", () => {
    const onOpenThesaurus = vi.fn();
    const { getByRole } = renderUi(
      <DictionaryResultCard
        vocabulary={singleSenseEntry}
        hasSearched
        isLoading={false}
        onOpenThesaurus={onOpenThesaurus}
      />,
    );
    const btn = getByRole("button", { name: /thesaurus/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onOpenThesaurus).toHaveBeenCalledOnce();
  });

  it("renders dual US and UK phonetics when phoneticsUs and phoneticsUk are set", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("/rʌn/")).toBeInTheDocument();
    expect(getByText("/rɑːn/")).toBeInTheDocument();
  });

  it("renders POS badge when partOfSpeech is set", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("động từ")).toBeInTheDocument();
  });

  it("falls back to single phonetic when phoneticsUs and phoneticsUk are null", () => {
    const { getByText, queryByLabelText } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
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
    const mockUtterance = {
      lang: "",
      onstart: null as (() => void) | null,
      onend: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn(() => mockUtterance),
    );

    const { getByLabelText } = renderUi(
      <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} />,
    );

    fireEvent.click(getByLabelText("Play US pronunciation"));
    expect(mockSpeak).toHaveBeenCalledOnce();
    expect(mockUtterance.lang).toBe("en-US");

    fireEvent.click(getByLabelText("Play UK pronunciation"));
    expect(mockCancel).toHaveBeenCalled();
    expect(mockUtterance.lang).toBe("en-GB");
  });

  it("renders dual phonetics on a single row (not two stacked rows)", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
    );
    // Both flags appear; they must be siblings inside one flex-row container
    const usFlag = container.querySelector("span.text-base");
    const row = usFlag?.parentElement?.parentElement;
    expect(row).not.toBeNull();
    // The outer phonetics container must NOT have flex-col
    expect(row?.className).not.toMatch(/flex-col/);
  });

  it("renders verb forms section when verbForms is set", () => {
    const { getByText, getByRole } = renderUi(
      <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("DẠNG ĐỘNG TỪ")).toBeInTheDocument();
    // The accordion starts collapsed; expand it to verify form content.
    fireEvent.click(getByRole("button", { name: /DẠNG ĐỘNG TỪ/i }));
    expect(getByText("runs")).toBeInTheDocument();
    expect(getByText("running")).toBeInTheDocument();
  });

  it("does not render verb forms section when verbForms is null", () => {
    const { queryByText } = renderUi(
      <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
    );
    expect(queryByText("DẠNG ĐỘNG TỪ")).not.toBeInTheDocument();
  });

  it("renders register pill when register is set", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("trang trọng")).toBeInTheDocument();
  });

  it("renders number pill with plural form when numberInfo has plural", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
    );
    expect(getByText("số nhiều: children")).toBeInTheDocument();
  });

  it("renders Thesaurus button in the sense tab row (not in the header tags)", () => {
    const { getByRole, container } = renderUi(
      <DictionaryResultCard
        vocabulary={verbEntry}
        hasSearched
        isLoading={false}
        onOpenThesaurus={vi.fn()}
      />,
    );
    const thesaurusBtn = getByRole("button", { name: /thesaurus/i });
    // The sense tab row contains the sense label buttons
    const senseTabRow = thesaurusBtn.closest(".flex.items-center");
    expect(senseTabRow).not.toBeNull();
    // Should NOT be inside the header tag wrapper
    const headerTagWrapper = container.querySelector(".flex.items-start.justify-between");
    expect(headerTagWrapper?.contains(thesaurusBtn)).toBe(false);
  });

  it("renders NearbyWordsBar when vocabulary has nearbyWords", () => {
    const onSearch = vi.fn();
    const { getByRole } = renderUi(
      <DictionaryResultCard
        vocabulary={verbEntry}
        hasSearched
        isLoading={false}
        onSearch={onSearch}
      />,
    );
    expect(getByRole("button", { name: "rum" })).toBeInTheDocument();
    fireEvent.click(getByRole("button", { name: "rune" }));
    expect(onSearch).toHaveBeenCalledWith("rune");
  });

  it("renders bold in example English text", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
    );
    // "She **ran** every day." — the <strong> tag should contain "ran"
    const strongTags = container.querySelectorAll("strong");
    const ranTag = [...strongTags].find((s) => s.textContent === "ran");
    expect(ranTag).toBeDefined();
  });

  it("renders bold EN text and Vietnamese in inline collocations", () => {
    const { container, getByText } = renderUi(
      <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
    );
    // "**go** for a run" — bold "go"
    const strongTags = container.querySelectorAll("strong");
    const goTag = [...strongTags].find((s) => s.textContent === "go");
    expect(goTag).toBeDefined();
    expect(getByText("đi chạy bộ")).toBeInTheDocument();
  });
});
