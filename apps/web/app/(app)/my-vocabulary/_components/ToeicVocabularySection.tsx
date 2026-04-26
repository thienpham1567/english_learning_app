"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownOutlined, LinkOutlined } from "@ant-design/icons";

type ToeicCategory = {
  id: string;
  label: string;
  emoji: string;
  words: string[];
};

const TOEIC_CATEGORIES: ToeicCategory[] = [
  {
    id: "business",
    label: "Kinh doanh",
    emoji: "💼",
    words: [
      "negotiate",
      "revenue",
      "deadline",
      "proposal",
      "budget",
      "contract",
      "merger",
      "investor",
      "stakeholder",
      "quarterly",
      "profit margin",
      "market share",
      "competitive advantage",
      "annual report",
      "cash flow",
    ],
  },
  {
    id: "office",
    label: "Văn phòng",
    emoji: "🏢",
    words: [
      "memo",
      "cubicle",
      "conference",
      "agenda",
      "attendance",
      "supervisor",
      "receptionist",
      "stationery",
      "photocopier",
      "filing cabinet",
      "break room",
      "bulletin board",
      "extension number",
      "open-plan",
      "workstation",
    ],
  },
  {
    id: "hr",
    label: "Nhân sự",
    emoji: "👥",
    words: [
      "recruit",
      "candidate",
      "resume",
      "interview",
      "probation",
      "benefits",
      "compensation",
      "promotion",
      "termination",
      "appraisal",
      "job posting",
      "onboarding",
      "severance pay",
      "maternity leave",
      "performance review",
    ],
  },
  {
    id: "finance",
    label: "Tài chính",
    emoji: "💰",
    words: [
      "invoice",
      "receipt",
      "deposit",
      "withdraw",
      "transaction",
      "interest rate",
      "tax deduction",
      "reimbursement",
      "expenditure",
      "audit",
      "balance sheet",
      "accounts payable",
      "fiscal year",
      "net income",
      "asset",
    ],
  },
  {
    id: "travel",
    label: "Du lịch & Giao thông",
    emoji: "✈️",
    words: [
      "itinerary",
      "boarding pass",
      "layover",
      "reservation",
      "accommodation",
      "commute",
      "fare",
      "departure",
      "customs",
      "immigration",
      "round trip",
      "carry-on",
      "check-in counter",
      "connecting flight",
      "travel voucher",
    ],
  },
  {
    id: "technology",
    label: "Công nghệ",
    emoji: "💻",
    words: [
      "software",
      "hardware",
      "database",
      "server",
      "bandwidth",
      "encryption",
      "interface",
      "upgrade",
      "troubleshoot",
      "compatible",
      "cloud computing",
      "data breach",
      "tech support",
      "operating system",
      "user-friendly",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    emoji: "📢",
    words: [
      "campaign",
      "brand",
      "target audience",
      "advertisement",
      "promotion",
      "survey",
      "consumer",
      "demographics",
      "endorsement",
      "launch",
      "market research",
      "social media",
      "focus group",
      "brand awareness",
      "sales pitch",
    ],
  },
  {
    id: "manufacturing",
    label: "Sản xuất",
    emoji: "🏭",
    words: [
      "assembly line",
      "warehouse",
      "inventory",
      "shipment",
      "supplier",
      "quality control",
      "defect",
      "raw material",
      "logistics",
      "forklift",
      "production schedule",
      "safety regulations",
      "shipping label",
      "bulk order",
      "manufacturing plant",
    ],
  },
];

type Props = {
  className?: string;
};

export function ToeicVocabularySection({ className }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleWordClick = (word: string) => {
    router.push(`/dictionary?q=${encodeURIComponent(word)}`);
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="[font-family:var(--font-display)] text-lg italic text-(--ink)">
          Từ vựng TOEIC theo chủ đề
        </h3>
        <p className="mt-0.5 text-xs text-(--text-muted)">Bấm vào từ để tra cứu chi tiết</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TOEIC_CATEGORIES.map((cat, _i) => {
          const isExpanded = expandedId === cat.id;
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border border-(--border) bg-(--surface)"
            >
              {/* Category header */}
              <button
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-(--surface-hover)"
                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="flex-1 text-sm font-semibold text-(--ink)">{cat.label}</span>
                <span className="text-[11px] text-(--text-muted)">{cat.words.length} từ</span>
                <DownOutlined
                  style={{
                    fontSize: 14,
                    flexShrink: 0,
                    color: "var(--text-muted)",
                    transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }}
                />
              </button>

              {/* Word list */}

              {isExpanded && (
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-1.5 border-t border-(--border) px-4 py-3">
                    {cat.words.map((word) => (
                      <button
                        key={word}
                        onClick={() => handleWordClick(word)}
                        className="group flex items-center gap-1 rounded-md border border-(--border) bg-(--bg-deep) px-2.5 py-1 text-[13px] text-(--ink) transition hover:border-(--accent) hover:bg-(--accent)/5 hover:text-(--accent)"
                      >
                        {word}
                        <LinkOutlined
                          style={{
                            fontSize: 10,
                            flexShrink: 0,
                            opacity: 0,
                            transition: "opacity 0.2s",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
