"use client";

import { useState } from "react";
import {
  BankOutlined,
  BarChartOutlined,
  TeamOutlined,
  DesktopOutlined,
  MailOutlined,
  CarOutlined,
  BookOutlined,
  GlobalOutlined,
  BankFilled,
  ExperimentOutlined,
  MedicineBoxOutlined,
  BulbOutlined,
  DownOutlined,
} from "@ant-design/icons";

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
    icon: <BankOutlined />,
    words: [
      "negotiate", "acquisition", "revenue", "expenditure", "dividend",
      "invoice", "budget", "profit", "deficit", "surplus",
      "shareholder", "merger", "bankruptcy", "audit", "liability",
      "asset", "equity", "franchise", "inflation", "commodity",
      "portfolio", "transaction", "subsidy", "tariff", "depreciation",
    ],
  },
  {
    label: "Marketing & Sales",
    icon: <BarChartOutlined />,
    words: [
      "campaign", "advertisement", "promotion", "brochure", "consumer",
      "retail", "wholesale", "endorsement", "demographic", "competitor",
      "survey", "feedback", "launch", "brand", "loyalty",
      "discount", "coupon", "rebate", "incentive", "warranty",
    ],
  },
  {
    label: "Human Resources",
    icon: <TeamOutlined />,
    words: [
      "recruit", "candidate", "resume", "interview", "qualification",
      "appoint", "resign", "retire", "probation", "evaluation",
      "compensation", "benefit", "overtime", "payroll", "pension",
      "supervisor", "subordinate", "colleague", "intern", "mentor",
    ],
  },
  {
    label: "Office & Technology",
    icon: <DesktopOutlined />,
    words: [
      "equipment", "maintenance", "installation", "implement", "upgrade",
      "database", "software", "hardware", "network", "compatible",
      "malfunction", "troubleshoot", "specification", "manual", "compliance",
      "productivity", "efficiency", "automate", "streamline", "integrate",
    ],
  },
  {
    label: "Communication",
    icon: <MailOutlined />,
    words: [
      "correspondence", "memorandum", "agenda", "minutes", "itinerary",
      "attachment", "inquiry", "confirmation", "notification", "proposal",
      "comply", "consent", "acknowledge", "postpone", "reschedule",
      "delegate", "collaborate", "coordinate", "facilitate", "negotiate",
    ],
  },
  {
    label: "Travel & Logistics",
    icon: <CarOutlined />,
    words: [
      "itinerary", "accommodation", "reservation", "departure", "destination",
      "shipment", "delivery", "warehouse", "inventory", "freight",
      "customs", "inspection", "cargo", "dispatch", "transit",
      "refund", "reimbursement", "voucher", "receipt", "expense",
    ],
  },
];

const IELTS_CATEGORIES: WordCategory[] = [
  {
    label: "Academic & Education",
    icon: <BookOutlined />,
    words: [
      "curriculum", "dissertation", "hypothesis", "methodology", "empirical",
      "pedagogy", "enrollment", "scholarship", "thesis", "seminar",
      "plagiarism", "bibliography", "symposium", "accreditation", "alumni",
      "undergraduate", "postgraduate", "faculty", "tenure", "sabbatical",
      "assessment", "criterion", "rubric", "syllabus", "tutorial",
    ],
  },
  {
    label: "Environment & Nature",
    icon: <GlobalOutlined />,
    words: [
      "sustainability", "biodiversity", "ecosystem", "pollution", "conservation",
      "deforestation", "renewable", "emission", "habitat", "endangered",
      "erosion", "drought", "carbon footprint", "greenhouse", "ozone",
      "glacier", "coral reef", "desertification", "urbanization", "recycle",
      "contamination", "preservation", "restoration", "reforestation", "degradation",
    ],
  },
  {
    label: "Society & Culture",
    icon: <BankFilled />,
    words: [
      "globalization", "urbanization", "migration", "demographic", "inequality",
      "diversity", "discrimination", "integration", "heritage", "tradition",
      "ideology", "legislation", "bureaucracy", "sovereignty", "diplomacy",
      "indigenous", "multicultural", "assimilation", "emancipation", "activism",
      "infrastructure", "welfare", "referendum", "constituency", "jurisdiction",
    ],
  },
  {
    label: "Science & Technology",
    icon: <ExperimentOutlined />,
    words: [
      "phenomenon", "algorithm", "innovation", "paradigm", "correlation",
      "variable", "synthesis", "genome", "biotechnology", "nanotechnology",
      "artificial intelligence", "automation", "quantum", "robotics", "catalyst",
      "molecule", "neuroscience", "simulation", "prototype", "cybersecurity",
      "encryption", "bandwidth", "interface", "infrastructure", "semiconductor",
    ],
  },
  {
    label: "Health & Medicine",
    icon: <MedicineBoxOutlined />,
    words: [
      "diagnosis", "symptom", "therapy", "chronic", "acute",
      "epidemic", "pandemic", "vaccine", "immunity", "rehabilitation",
      "prescription", "dosage", "metabolism", "nutrition", "obesity",
      "antibiotics", "pathogen", "contagious", "prognosis", "transplant",
      "wellbeing", "hygiene", "sanitation", "sedentary", "cardiovascular",
    ],
  },
  {
    label: "Abstract & Analysis",
    icon: <BulbOutlined />,
    words: [
      "ambiguous", "comprehensive", "contemporary", "controversial", "fundamental",
      "significant", "substantial", "prevalent", "inherent", "implicit",
      "explicit", "coherent", "feasible", "viable", "pragmatic",
      "abstract", "tangible", "empirical", "anecdotal", "paradox",
      "dilemma", "consensus", "anomaly", "discrepancy", "rationale",
    ],
  },
];

type TabKey = "toeic" | "ielts";

export function ExamWordLists({ onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("toeic");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = activeTab === "toeic" ? TOEIC_CATEGORIES : IELTS_CATEGORIES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tab header */}
      <div
        style={{
          display: "flex",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--bg-deep)",
        }}
      >
        {(["toeic", "ielts"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setExpandedCategory(null);
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--text-muted)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
        {activeTab === "toeic"
          ? "Từ vựng thiết yếu cho kỳ thi TOEIC — chủ đề business, office & communication."
          : "Từ vựng học thuật cho IELTS — chủ đề environment, society & science."}
      </p>

      {/* Category list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.label;
          return (
            <div key={cat.label}>
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.label)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: isExpanded ? "var(--accent-muted)" : "var(--surface)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isExpanded ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: isExpanded ? "var(--accent)" : "var(--text-muted)" }}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 8px",
                      borderRadius: 999,
                      background: isExpanded ? "var(--accent)" : "var(--bg-deep)",
                      color: isExpanded ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {cat.words.length}
                  </span>
                  <DownOutlined
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                    }}
                  />
                </span>
              </button>

              {isExpanded && (
                <div
                  className="anim-fade-in"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    padding: "10px 4px",
                  }}
                >
                  {cat.words.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => onSelect(word)}
                      style={{
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        padding: "4px 12px",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.color = "var(--accent)";
                        e.currentTarget.style.background = "var(--accent-muted)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "var(--surface)";
                      }}
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
