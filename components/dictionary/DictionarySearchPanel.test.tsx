import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("shows accented Vietnamese helper copy", () => {
    const { getByText, getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
  });
});
