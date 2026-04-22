import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { SessionShell } from "@/components/shared/SessionShell";
import { renderUi } from "@/test/render";

describe("SessionShell", () => {
  it("renders title, subtitle, progress, actions, and children", () => {
    renderUi(
      <SessionShell
        title="Grammar Quiz"
        subtitle="Question 2 of 5"
        progress={{ current: 2, total: 5 }}
        action={<button type="button">History</button>}
      >
        <div>Question card</div>
      </SessionShell>,
    );

    expect(screen.getByText("Grammar Quiz")).toBeInTheDocument();
    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("Question card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });
});
