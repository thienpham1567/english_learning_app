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
    renderUi(<CoLanhDictionaryPage />);

    expect(
      screen.getByRole("heading", {
        name: /Tra cứu từ vựng theo cách rõ ràng, dễ học lại/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Từ điển Cô Lành")).toBeInTheDocument();
  });
});
