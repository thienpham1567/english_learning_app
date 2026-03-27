import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("shows accented Vietnamese helper copy", () => {
    const { getByRole, getByText, getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    const searchInput = getByPlaceholderText("Ví dụ: take off");
    expect(searchInput).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toHaveClass(
      "max-[1120px]:w-full",
    );
    expect(searchInput.parentElement).toHaveClass(
      "min-[1121px]:grid-cols-[minmax(0,1fr)_auto]",
    );
  });
});
