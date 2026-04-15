import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderUi } from "@/test/render";
import { ThesaurusSheet } from "@/app/(app)/dictionary/_components/ThesaurusSheet";

const vocabulary = {
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
  numberInfo: null,
  frequencyBand: null,
  wordFamily: [],
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
      examplesVi: [],
      collocations: [],
      synonyms: ["leave", "exit"],
      antonyms: ["arrive", "land"],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
    {
      id: "sense-2",
      label: "Nghĩa 2",
      definitionVi: "Lệch khỏi",
      definitionEn: "To deviate from a standard.",
      usageNoteVi: null,
      examples: [],
      examplesVi: [],
      collocations: [],
      synonyms: [],
      antonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const emptyVocabulary = {
  ...vocabulary,
  senses: [
    {
      ...vocabulary.senses[0],
      synonyms: [],
      antonyms: [],
    },
  ],
};

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("ThesaurusSheet", () => {
  it("renders synonym and antonym pills when sheet is open", () => {
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={vi.fn()}
        onWordClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "leave" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "exit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "arrive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "land" })).toBeInTheDocument();
  });

  it("renders sense label for senses with data", () => {
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={vi.fn()}
        onWordClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Nghĩa 1")).toBeInTheDocument();
  });

  it("skips senses that have no synonyms and no antonyms", () => {
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={vi.fn()}
        onWordClick={vi.fn()}
      />,
    );
    expect(screen.queryByText("Nghĩa 2")).not.toBeInTheDocument();
  });

  it("shows empty message when all senses have no synonyms or antonyms", () => {
    renderUi(
      <ThesaurusSheet
        vocabulary={emptyVocabulary}
        isOpen
        onClose={vi.fn()}
        onWordClick={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Chưa có dữ liệu đồng/trái nghĩa."),
    ).toBeInTheDocument();
  });

  it("calls onWordClick and onClose when a synonym pill is clicked", () => {
    const onWordClick = vi.fn();
    const onClose = vi.fn();
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={onClose}
        onWordClick={onWordClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "leave" }));
    expect(onWordClick).toHaveBeenCalledWith("leave");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onWordClick and onClose when an antonym pill is clicked", () => {
    const onWordClick = vi.fn();
    const onClose = vi.fn();
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={onClose}
        onWordClick={onWordClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "arrive" }));
    expect(onWordClick).toHaveBeenCalledWith("arrive");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the × close button is clicked", () => {
    const onClose = vi.fn();
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={onClose}
        onWordClick={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render content when isOpen is false", () => {
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen={false}
        onClose={vi.fn()}
        onWordClick={vi.fn()}
      />,
    );
    expect(screen.queryByText("leave")).not.toBeInTheDocument();
  });

  it("closes sheet when Escape key is pressed", () => {
    const onClose = vi.fn();
    renderUi(
      <ThesaurusSheet
        vocabulary={vocabulary}
        isOpen
        onClose={onClose}
        onWordClick={vi.fn()}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
