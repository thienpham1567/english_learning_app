import { renderUi } from "@/test/render";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";

describe("DictionaryResultCard", () => {
  it("shows the result heading and the active tab content", () => {
    const entry = {
      query: "take off",
      headword: "take off",
      entryType: "phrasal_verb" as const,
      phonetic: "/teɪk ˈɒf/",
      level: "B1" as const,
      register: null,
      overviewVi: "Có nhiều nghĩa thông dụng trong giao tiếp.",
      overviewEn: "A common phrasal verb with multiple senses.",
      senses: [
        {
          id: "sense-1",
          label: "Nghĩa 1",
          definitionVi: "Cất cánh",
          definitionEn: "To leave the ground and begin flying.",
          usageNoteVi: null,
          examplesVi: [
            "Máy bay cất cánh đúng giờ.",
            "Chuyến bay cất cánh lúc bình minh.",
            "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh.",
          ],
          patterns: [],
          relatedExpressions: [],
          commonMistakesVi: [],
        },
      ],
    };

    const { getByRole, getByText, container } = renderUi(
      <DictionaryResultCard vocabulary={entry} hasSearched isLoading={false} />,
    );

    expect(getByText("Kết quả tra cứu")).toBeInTheDocument();
    expect(getByRole("tab", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
    const tabs = container.querySelector(".ant-tabs");
    expect(tabs).toHaveClass("mt-6");
    expect(tabs).not.toHaveClass("dictionary-result-card__tabs");
  });

  it("keeps a stable result surface in loading and empty states", () => {
    const { container, rerender } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched isLoading />,
    );

    expect(container.querySelector(".ant-card")).toHaveClass("min-h-[400px]");

    rerender(
      <DictionaryResultCard
        vocabulary={null}
        hasSearched={false}
        isLoading={false}
      />,
    );

    expect(container.querySelector(".ant-card")).toHaveClass("min-h-[400px]");
  });

  it("wraps the populated header on phones", () => {
    const entry = {
      query: "internationalization",
      headword: "internationalization",
      entryType: "word" as const,
      phonetic: null,
      level: null,
      register: null,
      overviewVi: "Một ví dụ từ dài để kiểm tra bố cục.",
      overviewEn: "A long headword used to check the responsive header.",
      senses: [
        {
          id: "sense-1",
          label: "Nghĩa 1",
          definitionVi: "Định nghĩa",
          definitionEn: "Definition",
          usageNoteVi: null,
          examplesVi: [
            "Ví dụ một.",
            "Ví dụ hai.",
            "Ví dụ ba.",
          ],
          patterns: [],
          relatedExpressions: [],
          commonMistakesVi: [],
        },
      ],
    };

    const { container } = renderUi(
      <DictionaryResultCard vocabulary={entry} hasSearched isLoading={false} />,
    );

    expect(
      container.querySelector(".flex.items-start.justify-between.gap-4"),
    ).toHaveClass("max-[720px]:flex-col");
  });

  it("shows empty state with diacritics before searching", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard
        vocabulary={null}
        hasSearched={false}
        isLoading={false}
      />,
    );

    expect(
      getByText("Sẵn sàng cho lần tra cứu đầu tiên"),
    ).toBeInTheDocument();
  });
});
