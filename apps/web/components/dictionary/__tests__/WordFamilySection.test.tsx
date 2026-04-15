import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { WordFamilySection } from "@/components/dictionary/WordFamilySection";

const wordFamily = [
  { pos: "noun", words: ["runner", "running"] },
  { pos: "adjective", words: ["runny"] },
];

describe("WordFamilySection", () => {
  it("renders nothing when wordFamily is null", () => {
    const { container } = renderUi(
      <WordFamilySection wordFamily={null} onSearch={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when wordFamily is empty array", () => {
    const { container } = renderUi(
      <WordFamilySection wordFamily={[]} onSearch={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders POS group labels", () => {
    renderUi(<WordFamilySection wordFamily={wordFamily} onSearch={vi.fn()} />);
    expect(screen.getByText("noun")).toBeInTheDocument();
    expect(screen.getByText("adjective")).toBeInTheDocument();
  });

  it("renders each word as a clickable pill button", () => {
    renderUi(<WordFamilySection wordFamily={wordFamily} onSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: "runner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "running" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "runny" })).toBeInTheDocument();
  });

  it("calls onSearch with the word when a pill is clicked", () => {
    const onSearch = vi.fn();
    renderUi(<WordFamilySection wordFamily={wordFamily} onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "runner" }));
    expect(onSearch).toHaveBeenCalledWith("runner");
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("renders a section heading for Word Family", () => {
    renderUi(<WordFamilySection wordFamily={wordFamily} onSearch={vi.fn()} />);
    expect(screen.getByText(/word family/i)).toBeInTheDocument();
  });
});
