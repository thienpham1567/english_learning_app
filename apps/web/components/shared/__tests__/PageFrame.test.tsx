import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { PageFrame } from "@/components/shared/PageFrame";
import { renderUi } from "@/test/render";

describe("PageFrame", () => {
  it("renders children inside a scrollable main frame", () => {
    renderUi(<PageFrame>Page content</PageFrame>);

    const region = screen.getByTestId("page-frame");
    expect(region).toHaveTextContent("Page content");
    expect(region).toHaveStyle({ overflowY: "auto" });
  });

  it("applies centered max width content when maxWidth is provided", () => {
    renderUi(<PageFrame maxWidth={720}>Centered</PageFrame>);

    const inner = screen.getByTestId("page-frame-inner");
    expect(inner).toHaveStyle({ maxWidth: "720px", margin: "0 auto" });
  });

  it("can disable padding for immersive screens", () => {
    renderUi(<PageFrame padded={false}>Immersive</PageFrame>);

    expect(screen.getByTestId("page-frame")).toHaveStyle({ padding: "0px" });
  });
});
