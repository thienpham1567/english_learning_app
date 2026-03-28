import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TypingIndicator } from "@/components/TypingIndicator";
import { renderUi } from "@/test/render";

describe("TypingIndicator", () => {
  it("renders the assistant typing state", () => {
    renderUi(<TypingIndicator />);

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Cô Minh đang nhập phản hồi",
    );
  });
});
