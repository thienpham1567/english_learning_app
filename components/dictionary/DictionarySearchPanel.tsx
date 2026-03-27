"use client";

import { BookOpenText, Sparkles } from "lucide-react";
import { Button, Card, Input } from "antd";

type DictionarySearchPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
};

const HELPER_TIPS = [
  "Bạn có thể nhập từ đơn, collocation, phrasal verb hoặc idiom.",
  "Nhấn Enter để tra cứu nhanh mà không cần bấm nút.",
  "Mỗi nghĩa sẽ có giải thích song ngữ và ví dụ chỉ bằng tiếng Việt.",
];

export function DictionarySearchPanel({
  value,
  onChange,
  onSearch,
  isLoading,
}: DictionarySearchPanelProps) {
  return (
    <section className="dictionary-search-panel">
      <Card className="dictionary-card dictionary-search-panel__card" variant="borderless">
        <div className="dictionary-search-panel__eyebrow">
          <Sparkles size={16} />
          <span>Tra cứu có cấu trúc</span>
        </div>

        <h2 className="dictionary-search-panel__title">Nhập mục từ cần tra cứu</h2>
        <p className="dictionary-search-panel__description">
          Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
        </p>

        <div className="dictionary-search-panel__controls">
          <Input
            size="large"
            value={value}
            placeholder="Ví dụ: take off"
            onChange={(event) => onChange(event.target.value)}
            onPressEnter={onSearch}
            disabled={isLoading}
          />
          <Button
            type="primary"
            size="large"
            onClick={onSearch}
            loading={isLoading}
            className="dictionary-search-panel__button"
          >
            Tra cứu
          </Button>
        </div>

        <p className="dictionary-search-panel__hint">
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </Card>

      <Card className="dictionary-card dictionary-tips-card" variant="borderless">
        <div className="dictionary-tips-card__header">
          <BookOpenText size={18} />
          <span>Mẹo sử dụng</span>
        </div>
        <ul className="dictionary-tips-card__list">
          {HELPER_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
