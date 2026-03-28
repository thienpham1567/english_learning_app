import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatMessage } from "@/components/ChatMessage";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/UserContext", () => ({
  useUser: () => ({ name: "Người học", image: null }),
}));

describe("ChatMessage", () => {
  it("renders assistant markdown content", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "**Hello**" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("keeps message meta hidden until hover", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "Hello" }} />);

    const meta = screen.getByText(/\d{2}:\d{2}/).parentElement;
    expect(meta).toHaveClass("opacity-0");
    expect(meta).toHaveClass("group-hover:opacity-100");
  });
});
