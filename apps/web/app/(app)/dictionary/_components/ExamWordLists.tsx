"use client";

import {
  BarChart2,
  BookOpen,
  Building2,
  Car,
  ChevronDown,
  FlaskConical,
  Globe,
  Landmark,
  Lightbulb,
  Mail,
  Monitor,
  Pill,
  Users,
} from "lucide-react";
import { useState } from "react";

type Props = {
  onSelect: (word: string) => void;
};

type WordCategory = {
  label: string;
  icon: React.ReactNode;
  words: string[];
};

const TOEIC_CATEGORIES: WordCategory[] = [
  {
    label: "Business & Finance",
    icon: <Landmark className="h-3.5 w-3.5" />,
    words: [
      "negotiate",
      "acquisition",
      "revenue",
      "expenditure",
      "dividend",
      "invoice",
      "budget",
      "profit",
      "deficit",
      "surplus",
      "shareholder",
      "merger",
      "bankruptcy",
      "audit",
      "liability",
      "asset",
      "equity",
      "franchise",
      "inflation",
      "commodity",
      "portfolio",
      "transaction",
      "subsidy",
      "tariff",
      "depreciation",
    ],
  },
  {
    label: "Marketing & Sales",
    icon: <BarChart2 className="h-3.5 w-3.5" />,
    words: [
      "campaign",
      "advertisement",
      "promotion",
      "brochure",
      "consumer",
      "retail",
      "wholesale",
      "endorsement",
      "demographic",
      "competitor",
      "survey",
      "feedback",
      "launch",
      "brand",
      "loyalty",
      "discount",
      "coupon",
      "rebate",
      "incentive",
      "warranty",
    ],
  },
  {
    label: "Human Resources",
    icon: <Users className="h-3.5 w-3.5" />,
    words: [
      "recruit",
      "candidate",
      "resume",
      "interview",
      "qualification",
      "appoint",
      "resign",
      "retire",
      "probation",
      "evaluation",
      "compensation",
      "benefit",
      "overtime",
      "payroll",
      "pension",
      "supervisor",
      "subordinate",
      "colleague",
      "intern",
      "mentor",
    ],
  },
  {
    label: "Office & Technology",
    icon: <Monitor className="h-3.5 w-3.5" />,
    words: [
      "equipment",
      "maintenance",
      "installation",
      "implement",
      "upgrade",
      "database",
      "software",
      "hardware",
      "network",
      "compatible",
      "malfunction",
      "troubleshoot",
      "specification",
      "manual",
      "compliance",
      "productivity",
      "efficiency",
      "automate",
      "streamline",
      "integrate",
    ],
  },
  {
    label: "Communication",
    icon: <Mail className="h-3.5 w-3.5" />,
    words: [
      "correspondence",
      "memorandum",
      "agenda",
      "minutes",
      "itinerary",
      "attachment",
      "inquiry",
      "confirmation",
      "notification",
      "proposal",
      "comply",
      "consent",
      "acknowledge",
      "postpone",
      "reschedule",
      "delegate",
      "collaborate",
      "coordinate",
      "facilitate",
      "negotiate",
    ],
  },
  {
    label: "Travel & Logistics",
    icon: <Car className="h-3.5 w-3.5" />,
    words: [
      "itinerary",
      "accommodation",
      "reservation",
      "departure",
      "destination",
      "shipment",
      "delivery",
      "warehouse",
      "inventory",
      "freight",
      "customs",
      "inspection",
      "cargo",
      "dispatch",
      "transit",
      "refund",
      "reimbursement",
      "voucher",
      "receipt",
      "expense",
    ],
  },
];

const IELTS_CATEGORIES: WordCategory[] = [
  {
    label: "Academic & Education",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    words: [
      "curriculum",
      "dissertation",
      "hypothesis",
      "methodology",
      "empirical",
      "pedagogy",
      "enrollment",
      "scholarship",
      "thesis",
      "seminar",
      "plagiarism",
      "bibliography",
      "symposium",
      "accreditation",
      "alumni",
      "undergraduate",
      "postgraduate",
      "faculty",
      "tenure",
      "sabbatical",
      "assessment",
      "criterion",
      "rubric",
      "syllabus",
      "tutorial",
    ],
  },
  {
    label: "Environment & Nature",
    icon: <Globe className="h-3.5 w-3.5" />,
    words: [
      "sustainability",
      "biodiversity",
      "ecosystem",
      "pollution",
      "conservation",
      "deforestation",
      "renewable",
      "emission",
      "habitat",
      "endangered",
      "erosion",
      "drought",
      "carbon footprint",
      "greenhouse",
      "ozone",
      "glacier",
      "coral reef",
      "desertification",
      "urbanization",
      "recycle",
      "contamination",
      "preservation",
      "restoration",
      "reforestation",
      "degradation",
    ],
  },
  {
    label: "Society & Culture",
    icon: <Building2 className="h-3.5 w-3.5" />,
    words: [
      "globalization",
      "urbanization",
      "migration",
      "demographic",
      "inequality",
      "diversity",
      "discrimination",
      "integration",
      "heritage",
      "tradition",
      "ideology",
      "legislation",
      "bureaucracy",
      "sovereignty",
      "diplomacy",
      "indigenous",
      "multicultural",
      "assimilation",
      "emancipation",
      "activism",
      "infrastructure",
      "welfare",
      "referendum",
      "constituency",
      "jurisdiction",
    ],
  },
  {
    label: "Science & Technology",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    words: [
      "phenomenon",
      "algorithm",
      "innovation",
      "paradigm",
      "correlation",
      "variable",
      "synthesis",
      "genome",
      "biotechnology",
      "nanotechnology",
      "artificial intelligence",
      "automation",
      "quantum",
      "robotics",
      "catalyst",
      "molecule",
      "neuroscience",
      "simulation",
      "prototype",
      "cybersecurity",
      "encryption",
      "bandwidth",
      "interface",
      "infrastructure",
      "semiconductor",
    ],
  },
  {
    label: "Health & Medicine",
    icon: <Pill className="h-3.5 w-3.5" />,
    words: [
      "diagnosis",
      "symptom",
      "therapy",
      "chronic",
      "acute",
      "epidemic",
      "pandemic",
      "vaccine",
      "immunity",
      "rehabilitation",
      "prescription",
      "dosage",
      "metabolism",
      "nutrition",
      "obesity",
      "antibiotics",
      "pathogen",
      "contagious",
      "prognosis",
      "transplant",
      "wellbeing",
      "hygiene",
      "sanitation",
      "sedentary",
      "cardiovascular",
    ],
  },
  {
    label: "Abstract & Analysis",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    words: [
      "ambiguous",
      "comprehensive",
      "contemporary",
      "controversial",
      "fundamental",
      "significant",
      "substantial",
      "prevalent",
      "inherent",
      "implicit",
      "explicit",
      "coherent",
      "feasible",
      "viable",
      "pragmatic",
      "abstract",
      "tangible",
      "empirical",
      "anecdotal",
      "paradox",
      "dilemma",
      "consensus",
      "anomaly",
      "discrepancy",
      "rationale",
    ],
  },
];

type TabKey = "toeic" | "ielts";

export function ExamWordLists({ onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("toeic");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = activeTab === "toeic" ? TOEIC_CATEGORIES : IELTS_CATEGORIES;

  return (
    <div className="flex flex-col gap-3">
      {/* Tab header */}
      <div className="flex rounded-lg overflow-hidden border border-border bg-bg-deep">
        {(["toeic", "ielts"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setExpandedCategory(null);
            }}
            className={`flex-1 py-2.5 text-[13px] font-bold tracking-wider uppercase border-none cursor-pointer transition-all duration-200 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted leading-snug m-0">
        {activeTab === "toeic"
          ? "Essential vocabulary for the TOEIC exam — covering business, office & communication."
          : "Academic vocabulary for IELTS — covering environment, society & science."}
      </p>

      {/* Category list */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.label;
          return (
            <div key={cat.label}>
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.label)}
                className={`flex w-full items-center justify-between px-3 py-2 rounded-sm border cursor-pointer transition-all duration-200 text-[13px] font-bold ${
                  isExpanded
                    ? "bg-accent-light text-ink border-accent-hover"
                    : "bg-surface border-border text-text-primary hover:bg-surface-alt"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={isExpanded ? "text-accent-hover" : "text-text-muted"}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                      isExpanded
                        ? "bg-primary text-primary-foreground border border-border"
                        : "bg-bg-deep text-text-muted border border-border/20"
                    }`}
                  >
                    {cat.words.length}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isExpanded && (
                <div className="anim-fade-in flex flex-wrap gap-1.5 px-1 py-2.5">
                  {cat.words.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => onSelect(word)}
                      className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-text-secondary font-bold cursor-pointer transition-all duration-150 whitespace-nowrap hover:border-accent hover:text-ink hover:bg-accent-light"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
