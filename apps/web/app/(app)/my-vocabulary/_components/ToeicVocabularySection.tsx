"use client";

import {
  Briefcase,
  Building2,
  ChevronDown,
  Coins,
  Factory,
  Laptop,
  Link as LinkIcon,
  Megaphone,
  Plane,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ToeicCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  words: string[];
};

const TOEIC_CATEGORIES: ToeicCategory[] = [
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
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
    label: "Office",
    icon: Building2,
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
    label: "Human Resources",
    icon: Users,
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
    label: "Finance",
    icon: Coins,
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
    label: "Travel & Transport",
    icon: Plane,
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
    label: "Technology",
    icon: Laptop,
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
    icon: Megaphone,
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
    label: "Manufacturing",
    icon: Factory,
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

const CATEGORY_COLORS: Record<string, string> = {
  business: "text-indigo-600 dark:text-indigo-400",
  office: "text-sky-600 dark:text-sky-400",
  hr: "text-rose-600 dark:text-rose-400",
  finance: "text-amber-600 dark:text-amber-400",
  travel: "text-teal-600 dark:text-teal-400",
  technology: "text-purple-600 dark:text-purple-400",
  marketing: "text-pink-600 dark:text-pink-400",
  manufacturing: "text-stone-600 dark:text-stone-400",
};

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
        <h3 className="font-display text-lg italic text-ink">
          TOEIC Vocabulary by Topic
        </h3>
        <p className="mt-0.5 text-xs text-text-muted">Click on a word for details</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TOEIC_CATEGORIES.map((cat, _i) => {
          const isExpanded = expandedId === cat.id;
          const iconColor = CATEGORY_COLORS[cat.id] ?? "text-text-secondary";
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border-2 border-border bg-surface"
            >
              {/* Category header */}
              <button
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
              >
                <span className={`text-lg ${iconColor} flex items-center justify-center`}>
                  <cat.icon size={18} />
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{cat.label}</span>
                <span className="text-[11px] text-text-muted">{cat.words.length} words</span>
                <ChevronDown
                  className={`text-sm shrink-0 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {/* Word list */}
              {isExpanded && (
                <div className="overflow-hidden animate-fade-in">
                  <div className="flex flex-wrap gap-1.5 border-t-2 border-border px-4 py-3 bg-surface-alt">
                    {cat.words.map((word) => (
                      <button
                        key={word}
                        onClick={() => handleWordClick(word)}
                        className="group flex items-center gap-1 rounded-md border-2 border-border bg-bg-deep px-2.5 py-1 text-[13px] text-ink font-semibold transition cursor-pointer hover:border-accent hover:bg-accent-light"
                      >
                        {word}
                        <LinkIcon
                          size={10}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
