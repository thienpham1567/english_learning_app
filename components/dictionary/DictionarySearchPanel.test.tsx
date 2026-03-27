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
      "max-[720px]:w-full",
    );
    expect(searchInput.parentElement).toHaveClass(
      "grid-cols-[minmax(0,1fr)_auto]",
      "max-[720px]:grid-cols-1",
    );
  });
});
