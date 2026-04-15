// components/app/__tests__/VocabularyDetailSheet.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VocabularyDetailSheet } from "../VocabularyDetailSheet";
import http from "@/lib/http";

vi.mock("@/lib/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
      collocations: [],
      synonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const mockVocabWithCollocations = {
  ...mockVocab,
  senses: [
    {
      ...mockVocab.senses[0],
      collocations: [{ en: "take off quickly", vi: "cất cánh nhanh" }],
    },
  ],
};

const mockMultiWordWord = {
  ...mockVocab,
  query: "strong coffee",
  headword: "strong coffee",
  entryType: "word",
  partOfSpeech: "noun phrase",
  overviewVi: "Một cụm từ thường gặp.",
  overviewEn: "A common phrase.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPush.mockClear();
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
    vi.mocked(http.get).mockReturnValue(new Promise(() => {}));
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
    vi.mocked(http.get).mockResolvedValueOnce({
      data: mockVocab,
    });
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

  it("uses a generic label for word entries in the saved detail sheet", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: mockMultiWordWord,
    });
    render(
      <VocabularyDetailSheet
        query="strong coffee"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("strong coffee")).toBeInTheDocument();
    });
    expect(screen.getByText("Từ / cụm từ")).toBeInTheDocument();
    expect(screen.queryByText("Từ đơn")).not.toBeInTheDocument();
  });

  it("does not render collocations in the saved detail sheet", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: mockVocabWithCollocations,
    });
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
    expect(screen.queryByText("take off quickly")).not.toBeInTheDocument();
    expect(screen.queryByText("cất cánh nhanh")).not.toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error("not_found"));
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
    vi.mocked(http.get).mockResolvedValueOnce({
      data: mockVocab,
    });
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

  it("renders 'Tra cứu trong từ điển' button when data is loaded", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
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
    expect(screen.getByLabelText("Tra cứu trong từ điển")).toBeInTheDocument();
  });

  it("navigates to dictionary page when 'Tra cứu trong từ điển' is clicked", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
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
    fireEvent.click(screen.getByLabelText("Tra cứu trong từ điển"));
    expect(mockPush).toHaveBeenCalledWith("/dictionary?q=take%20off");
  });

  it("calls onToggleSaved when save button clicked", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: mockVocab,
    });
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

  it("renders 'Xem trong từ điển' button in the content area when data is loaded", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
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
    expect(
      screen.getByRole("button", { name: "Xem trong từ điển" }),
    ).toBeInTheDocument();
  });

  it("navigates to dictionary when 'Xem trong từ điển' button is clicked", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
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
    fireEvent.click(screen.getByRole("button", { name: "Xem trong từ điển" }));
    expect(mockPush).toHaveBeenCalledWith("/dictionary?q=take%20off");
  });
});
