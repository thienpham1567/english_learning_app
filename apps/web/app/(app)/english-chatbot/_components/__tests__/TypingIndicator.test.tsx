import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TypingIndicator } from "@/app/(app)/english-chatbot/_components/TypingIndicator";
import { renderUi } from "@/test/render";

describe("TypingIndicator", () => {
  it("renders the assistant typing state with persona name", () => {
    renderUi(<TypingIndicator personaName="Simon Hosking" />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAccessibleName("Simon Hosking đang nhập phản hồi");
  });

  it("uses a fallback name when personaName is omitted", () => {
    renderUi(<TypingIndicator />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Gia sư đang nhập phản hồi");
  });
});
