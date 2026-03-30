// app/(app)/my-vocabulary/__tests__/page.test.tsx
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import MyVocabularyPage from "../page";

vi.mock("nuqs", async () => {
  const { useState, useCallback } = await import("react");
  return {
    useQueryState: (_key: string, _parser?: unknown) => {
      const [val, setVal] = useState<string | null>(null);
      const setter = useCallback(
        (v: string | null | ((prev: string | null) => string | null)) => {
          setVal(v);
          return Promise.resolve(null);
        },
        [],
      );
      return [val, setter];
    },
    useQueryStates: (schema: Record<string, unknown>) => {
      const defaults: Record<string, unknown> = {};
      for (const key of Object.keys(schema)) defaults[key] = (schema[key] as { _default?: unknown })._default ?? null;
      // Provide sensible defaults matching the app's withDefault calls
      const initial = { search: "", level: [] as string[], type: [] as string[], saved: false };
      const [state, setState] = useState(initial);
      const setter = useCallback(
        (patch: Record<string, unknown>) => {
          setState((prev: typeof initial) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(patch)) {
              if (v === null) {
                (next as Record<string, unknown>)[k] = (initial as Record<string, unknown>)[k];
              } else {
                (next as Record<string, unknown>)[k] = v;
              }
            }
            return next;
          });
          return Promise.resolve(null);
        },
        [],
      );
      return [state, setter];
    },
    parseAsString: { withDefault: (d: unknown) => ({ _default: d }) },
    parseAsBoolean: { withDefault: (d: unknown) => ({ _default: d }) },
    parseAsArrayOf: () => ({ withDefault: (d: unknown) => ({ _default: d }) }),
  };
});

const ENTRIES = [
  {
    id: "1",
    query: "take off",
    saved: false,
    lookedUpAt: new Date().toISOString(),
    headword: "take off",
    level: "B1",
    entryType: "phrasal_verb",
  },
  {
    id: "2",
    query: "beautiful",
    saved: true,
    lookedUpAt: new Date().toISOString(),
    headword: "beautiful",
    level: "A2",
    entryType: "word",
  },
  {
    id: "3",
    query: "run out of",
    saved: false,
    lookedUpAt: new Date().toISOString(),
    headword: "run out of",
    level: "B2",
    entryType: "phrasal_verb",
  },
];

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (url === "/api/vocabulary") {
        return Promise.resolve({ json: async () => ENTRIES });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MyVocabularyPage", () => {
  it("renders all entries after loading", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => {
      expect(screen.getByText("take off")).toBeInTheDocument();
      expect(screen.getByText("beautiful")).toBeInTheDocument();
      expect(screen.getByText("run out of")).toBeInTheDocument();
    });
  });

  it("shows stats bar with correct counts", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
    expect(screen.getByText("1")).toBeInTheDocument(); // saved count
  });

  it("filters entries by search text", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.change(screen.getByLabelText("Tìm kiếm từ vựng"), {
      target: { value: "take" },
    });
    expect(screen.getByText("take off")).toBeInTheDocument();
    expect(screen.queryByText("beautiful")).not.toBeInTheDocument();
  });

  it("filters entries by CEFR level", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByRole("button", { name: "A2" }));
    expect(screen.getByText("beautiful")).toBeInTheDocument();
    expect(screen.queryByText("take off")).not.toBeInTheDocument();
  });

  it("filters entries by saved-only", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByRole("button", { name: "Đã lưu" }));
    expect(screen.getByText("beautiful")).toBeInTheDocument();
    expect(screen.queryByText("take off")).not.toBeInTheDocument();
  });

  it("clear all resets all filters", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.change(screen.getByLabelText("Tìm kiếm từ vựng"), {
      target: { value: "take" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xoá bộ lọc" }));
    expect(screen.getByText("beautiful")).toBeInTheDocument();
  });

  it("opens the detail sheet when a card is clicked", async () => {
    vi.mocked(fetch).mockImplementation((url: string) => {
      if (url === "/api/vocabulary") {
        return Promise.resolve({ json: async () => ENTRIES });
      }
      if (String(url).includes("/detail")) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByText("take off").closest("div[class*='group']")!);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("deletes an entry and shows undo toast", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByLabelText("Xoá từ này"));
    expect(screen.queryByText("take off")).not.toBeInTheDocument();
    expect(screen.getByText("Đã xoá")).toBeInTheDocument();
  });

  it("undo restores the deleted entry", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByLabelText("Xoá từ này"));
    fireEvent.click(screen.getByText("Hoàn tác"));
    expect(screen.getByText("take off")).toBeInTheDocument();
    expect(screen.queryByText("Đã xoá")).not.toBeInTheDocument();
  });

  it("fires DELETE request after 5 seconds if not undone", async () => {
    render(<MyVocabularyPage />);
    await waitFor(() => screen.getByText("take off"));
    fireEvent.click(screen.getByLabelText("Xoá từ này"));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("take%20off"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
