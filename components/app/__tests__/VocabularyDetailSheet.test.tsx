// components/app/__tests__/VocabularyDetailSheet.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VocabularyDetailSheet } from "../VocabularyDetailSheet";

const mockVocab = {
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb",
  phonetic: null,
  phoneticsUs: "/teɪk ɒf/",
  phoneticsUk: "/teɪk ɒf/",
  partOfSpeech: "verb",
  level: "B1",
  register: null,
  overviewVi: "Cất cánh; khởi đầu",
  overviewEn: "To leave the ground and start to fly",
  senses: [
    {
      id: "s1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground",
      usageNoteVi: null,
      examplesVi: [],
      examples: [{ en: "The plane took off.", vi: "Máy bay cất cánh." }],
      synonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
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
  vi.stubGlobal("fetch", vi.fn());
});

describe("VocabularyDetailSheet", () => {
  it("renders nothing when query is null", () => {
    render(
      <VocabularyDetailSheet
        query={null}
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows loading skeleton when query is set", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Đang tải...")).toBeInTheDocument();
  });

  it("shows full data when loaded", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVocab,
    } as Response);
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("take off")).toBeInTheDocument();
    });
    expect(screen.getByText("Cất cánh; khởi đầu")).toBeInTheDocument();
    expect(screen.getByText("The plane took off.")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Định nghĩa không còn trong bộ nhớ đệm."),
      ).toBeInTheDocument();
    });
  });

  it("calls onClose when Escape is pressed", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVocab,
    } as Response);
    const onClose = vi.fn();
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={onClose}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onToggleSaved when save button clicked", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVocab,
    } as Response);
    const onToggleSaved = vi.fn();
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={onToggleSaved}
      />,
    );
    await waitFor(() => screen.getByLabelText("Lưu từ này"));
    fireEvent.click(screen.getByLabelText("Lưu từ này"));
    expect(onToggleSaved).toHaveBeenCalledOnce();
  });
});
