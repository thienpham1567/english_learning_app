import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { FilterBar } from "@/components/shared/FilterBar";
import { renderUi } from "@/test/render";

describe("FilterBar", () => {
  it("renders leading content, filters, result count, and actions", () => {
    renderUi(
      <FilterBar
        label="Filters"
        countLabel="12 results"
        action={<button type="button">Clear</button>}
      >
        <button type="button">A1</button>
        <button type="button">B1</button>
      </FilterBar>,
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("12 results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
