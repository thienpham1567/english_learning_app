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
  "Nhap mot tu tieng Anh duy nhat, vi du: curious, sturdy, whisper.",
  "Nhan Enter de tra cuu nhanh ma khong can bam chuot.",
  "Ket qua se hien thi nghia, vi du, muc do va ghi chu ngu phap.",
];

export function DictionarySearchPanel({
  value,
  onChange,
  onSearch,
  isLoading,
}: DictionarySearchPanelProps) {
  return (
    <section className="dictionary-search-panel">
      <Card className="dictionary-card dictionary-search-panel__card" bordered={false}>
        <div className="dictionary-search-panel__eyebrow">
          <Sparkles size={16} />
          <span>Tra cuu co cau truc</span>
        </div>

        <h2 className="dictionary-search-panel__title">Nhap tu vung can giai nghia</h2>
        <p className="dictionary-search-panel__description">
          Cong cu nay duoc thiet ke cho mot tu tieng Anh moi lan tra cuu, giup
          ban doc nghia, cach doc va ghi chu ngu phap ro rang hon.
        </p>

        <div className="dictionary-search-panel__controls">
          <Input
            size="large"
            value={value}
            placeholder="Vi du: resilient"
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
            Tra cuu
          </Button>
        </div>

        <p className="dictionary-search-panel__hint">
          Chi ho tro tu tieng Anh don le, toi da 48 ky tu.
        </p>
      </Card>

      <Card className="dictionary-card dictionary-tips-card" bordered={false}>
        <div className="dictionary-tips-card__header">
          <BookOpenText size={18} />
          <span>Meo su dung</span>
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
