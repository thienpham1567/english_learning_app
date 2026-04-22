import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { PageHeader } from "@/components/shared/PageHeader";
import { renderUi } from "@/test/render";

describe("PageHeader", () => {
  it("renders title, subtitle, icon, and badge", () => {
    renderUi(
      <PageHeader
        icon={<span data-testid="header-icon">I</span>}
        eyebrow="Vocabulary"
        title="My Words"
        subtitle="Review saved words"
        badge="12 due"
      />,
    );

    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("My Words")).toBeInTheDocument();
    expect(screen.getByText("Review saved words")).toBeInTheDocument();
    expect(screen.getByText("12 due")).toBeInTheDocument();
    expect(screen.getByTestId("header-icon")).toBeInTheDocument();
  });

  it("renders an action slot", () => {
    renderUi(<PageHeader title="Progress" action={<button type="button">Refresh</button>} />);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
