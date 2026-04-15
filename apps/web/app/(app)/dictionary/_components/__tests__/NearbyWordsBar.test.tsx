import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { NearbyWordsBar } from "@/app/(app)/dictionary/_components/NearbyWordsBar";

const words = ["rain", "rainbow", "raise", "rake", "rally"];
// headword "run" is NOT in the words array (server excludes it)

describe("NearbyWordsBar", () => {
  it("renders nothing when words array is empty", () => {
    const { container } = renderUi(<NearbyWordsBar words={[]} headword="run" onSearch={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders each nearby word as a button", () => {
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: "rain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rally" })).toBeInTheDocument();
  });

  it("calls onSearch with the word when a nearby word is clicked", () => {
    const onSearch = vi.fn();
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "rainbow" }));
    expect(onSearch).toHaveBeenCalledWith("rainbow");
  });

  it("displays the headword as non-interactive text in the bar", () => {
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={vi.fn()} />);
    // headword shown as a span, not a button
    const buttons = screen.getAllByRole("button");
    const buttonLabels = buttons.map((b) => b.textContent);
    expect(buttonLabels).not.toContain("run");
    expect(screen.getByText("run")).toBeInTheDocument();
  });
});
