import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CoLanhDictionaryPage from "@/app/(app)/co-lanh-dictionary/page";
import { renderUi } from "@/test/render";

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
    const pageWrapper = container.querySelector("div.min-h-full, div.h-full");
    const layoutSection = container.querySelectorAll("section")[1];

    expect(
      screen.getByRole("heading", {
        name: /Tra cứu từ vựng theo cách rõ ràng, dễ học lại/i,
      }),
    ).toBeInTheDocument();
    expect(pageWrapper).toHaveClass(
      "h-full",
      "min-h-0",
      "overflow-y-auto",
      "px-8",
      "pt-9",
      "pb-12",
    );
    expect(layoutSection).toHaveClass(
      "min-[1121px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
    );
  });
});
