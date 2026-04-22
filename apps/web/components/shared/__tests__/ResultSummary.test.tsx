import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { ResultSummary } from "@/components/shared/ResultSummary";
import { renderUi } from "@/test/render";

describe("ResultSummary", () => {
  it("renders score, title, metrics, and actions", () => {
    const onRetry = vi.fn();
    renderUi(
      <ResultSummary
        score="8/10"
        title="Good work"
        subtitle="You earned 20 XP"
        metrics={[
          { label: "Correct", value: "8" },
          { label: "Time", value: "4:20" },
        ]}
        actions={[{ label: "Retry", onClick: onRetry }]}
      />,
    );

    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Good work")).toBeInTheDocument();
    expect(screen.getByText("You earned 20 XP")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
