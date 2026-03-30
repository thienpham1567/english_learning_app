import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("renders the accent label, input placeholder, and search button", () => {
    const { getByText, getByPlaceholderText, getByRole } = renderUi(
      <DictionarySearchPanel
        initialValue=""
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toBeInTheDocument();
  });

  it("input has bottom-border-only styling and no antd card wrapper", () => {
    const { getByPlaceholderText, container } = renderUi(
      <DictionarySearchPanel
        initialValue=""
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    const input = getByPlaceholderText("Ví dụ: take off");
    expect(input).toHaveClass("border-b", "bg-transparent");
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("search button is full-width rounded pill", () => {
    const { getByRole } = renderUi(
      <DictionarySearchPanel
        initialValue=""
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    const button = getByRole("button", { name: "Tra cứu" });
    expect(button).toHaveClass("rounded-full", "w-full");
  });

  it("tips render as 3 list items with left-border accent styling", () => {
    const { container } = renderUi(
      <DictionarySearchPanel
        initialValue=""
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    const tips = container.querySelectorAll("li");
    expect(tips).toHaveLength(3);
    tips.forEach((tip) => {
      expect(tip).toHaveClass("border-l-2");
      expect(tip).toHaveClass("pl-4");
    });
  });

  it("shows autocomplete suggestions after debounce when value has 2+ chars", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ suggestions: ["take off", "take on"] }),
    } as Response);

    renderUi(
      <DictionarySearchPanel
        initialValue="ta"
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /take off/ })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /take on/ })).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("calls onSubmit when a suggestion is clicked", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ suggestions: ["take off"] }),
    } as Response);

    const onSubmit = vi.fn();

    renderUi(
      <DictionarySearchPanel
        initialValue="ta"
        onSubmit={onSubmit}
        isLoading={false}
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => screen.getByRole("option", { name: /take off/ }));
    fireEvent.mouseDown(screen.getByRole("option", { name: /take off/ }));

    expect(onSubmit).toHaveBeenCalledWith("take off");

    vi.useRealTimers();
  });

  it("ArrowDown highlights the first suggestion", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ suggestions: ["take off", "take on"] }),
    } as Response);

    const { getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        initialValue="ta"
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    await act(async () => { await vi.runAllTimersAsync(); });
    await waitFor(() => screen.getByRole("option", { name: /take off/ }));

    fireEvent.keyDown(getByPlaceholderText("Ví dụ: take off"), { key: "ArrowDown" });

    expect(screen.getByRole("option", { name: /take off/ })).toHaveAttribute("aria-selected", "true");

    vi.useRealTimers();
  });

  it("Escape clears suggestions", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ suggestions: ["take off"] }),
    } as Response);

    const { getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        initialValue="ta"
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    await act(async () => { await vi.runAllTimersAsync(); });
    await waitFor(() => screen.getByRole("option", { name: /take off/ }));

    fireEvent.keyDown(getByPlaceholderText("Ví dụ: take off"), { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /take off/ })).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("does not fetch suggestions when value is less than 2 chars", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn();

    renderUi(
      <DictionarySearchPanel
        initialValue="t"
        onSubmit={() => {}}
        isLoading={false}
      />,
    );

    await act(async () => { await vi.runAllTimersAsync(); });

    expect(global.fetch).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
