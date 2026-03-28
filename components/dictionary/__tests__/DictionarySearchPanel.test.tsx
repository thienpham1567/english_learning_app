import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("renders the accent label, input placeholder, and search button", () => {
    const { getByText, getByPlaceholderText, getByRole } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toBeInTheDocument();
  });

  it("input has bottom-border-only styling and no antd card wrapper", () => {
    const { getByPlaceholderText, container } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const input = getByPlaceholderText("Ví dụ: take off");
    expect(input).toHaveClass("border-b", "bg-transparent");
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("search button is full-width rounded pill", () => {
    const { getByRole } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const button = getByRole("button", { name: "Tra cứu" });
    expect(button).toHaveClass("rounded-full", "w-full");
  });

  it("tips render as 3 list items with left-border accent styling", () => {
    const { container } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const tips = container.querySelectorAll("li");
    expect(tips).toHaveLength(3);
    tips.forEach((tip) => {
      expect(tip).toHaveClass("border-l-2");
      expect(tip).toHaveClass("pl-4");
    });
  });
});
