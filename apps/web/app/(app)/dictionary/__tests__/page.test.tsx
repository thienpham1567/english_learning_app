import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CoLanhDictionaryPage from "@/app/(app)/dictionary/page";
import { renderUi } from "@/test/render";

vi.mock("nuqs", () => ({
  useQueryState: () => ["", vi.fn()],
  parseAsString: { withDefault: () => ({}) },
}));

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  return {
    ...actual,
    message: {
      useMessage: () => [{ error: vi.fn() }, <div key="message-context" />],
    },
  };
});

describe("CoLanhDictionaryPage", () => {
  it("renders the hero copy and search panel", () => {
    const { container } = renderUi(<CoLanhDictionaryPage />);
    const pageWrapper = container.querySelector("div.h-full");
    const layoutSection = container.querySelector("section.grid.items-start.gap-6");

    expect(
      screen.getByRole("heading", {
        name: /Nhập mục từ cần tra cứu/i,
      }),
    ).toBeInTheDocument();
    expect(pageWrapper).toHaveClass("h-full", "min-h-0");
    expect(layoutSection).toHaveClass("min-[1121px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]");
  });
});
