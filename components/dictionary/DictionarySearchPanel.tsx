"use client";

import { BookOpenText, Sparkles } from "lucide-react";
import { Button, Card, Input } from "antd";
import { motion } from "motion/react";

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
    <section className="space-y-5">
      <Card
        className="dictionary-card overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] min-[1121px]:sticky min-[1121px]:top-6"
        variant="borderless"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          <Sparkles size={14} />
          <span>Tra cứu có cấu trúc</span>
        </div>

        <h2 className="mt-4 text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
          Nhập mục từ cần tra cứu
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
        </p>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-[720px]:grid-cols-1">
          <Input
            size="large"
            value={value}
            placeholder="Ví dụ: take off"
            onChange={(event) => onChange(event.target.value)}
            onPressEnter={onSearch}
            disabled={isLoading}
            className="dictionary-search-input min-h-[46px] rounded-[var(--radius)]"
          />
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              type="primary"
              size="large"
              onClick={onSearch}
              loading={isLoading}
              className="h-[46px] min-w-[110px] !rounded-[var(--radius)] !border-0 !bg-[var(--accent)] !px-5 !font-semibold hover:!opacity-90 max-[720px]:w-full focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-[var(--accent)]"
            >
              Tra cứu
            </Button>
          </motion.div>
        </div>

        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </Card>

      <Card
        className="dictionary-card overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
        variant="borderless"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <BookOpenText size={16} />
          <span>Mẹo sử dụng</span>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
          {HELPER_TIPS.map((tip, i) => (
            <motion.li
              key={tip}
              className="rounded-[var(--radius)] bg-[var(--bg-deep)] px-4 py-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
            >
              {tip}
            </motion.li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
