import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { StateBlock } from "@/components/shared/StateBlock";
import { renderUi } from "@/test/render";

describe("StateBlock", () => {
  it("renders loading state", () => {
    renderUi(<StateBlock variant="loading" title="Loading data" />);

    expect(screen.getByText("Loading data")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty state with an action", () => {
    const onAction = vi.fn();
    renderUi(
      <StateBlock
        variant="empty"
        title="No words"
        description="Save a word first."
        actionLabel="Open dictionary"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open dictionary" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders error state", () => {
    renderUi(<StateBlock variant="error" title="Could not load" description="Try again later." />);

    expect(screen.getByText("Could not load")).toBeInTheDocument();
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
  });
});
