import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { ModuleHero } from "@/components/shared/ModuleHero";
import { renderUi } from "@/test/render";

describe("ModuleHero", () => {
  it("renders hero content and stats", () => {
    renderUi(
      <ModuleHero
        icon={<span data-testid="hero-icon">H</span>}
        tone="var(--module-reading)"
        eyebrow="Reading"
        title="Read by Level"
        subtitle="Practice graded passages"
        stats={[
          { label: "Read", value: "8" },
          { label: "Due", value: "3" },
        ]}
      />,
    );

    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Read by Level")).toBeInTheDocument();
    expect(screen.getByText("Practice graded passages")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByTestId("hero-icon")).toBeInTheDocument();
  });
});
