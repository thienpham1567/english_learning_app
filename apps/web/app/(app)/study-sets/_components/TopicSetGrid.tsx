"use client";

import { useState } from "react";

import type { ReactNode } from "react";
import * as m from "motion/react-client";
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  CircleCheckBig,
  Clock,
  Globe,
  Laptop,
  MapPin,
  Stethoscope,
  Store,
} from "lucide-react";

export type StudyTopic = {
  id: string;
  title: string;
  level: string;
  time: string;
};

export type StudyCategory = {
  category: string;
  icon: ReactNode;
  color: string;
  topics: StudyTopic[];
};

export const STUDY_TOPICS: StudyCategory[] = [
  {
    category: "Business & Office",
    icon: <Store />,
    color: "var(--module-listening)",
    topics: [
      { id: "business-meetings", title: "Business Meetings", level: "B1", time: "15 min" },
      { id: "email-writing", title: "Email Writing", level: "B1", time: "15 min" },
      { id: "job-interview", title: "Job Interviews", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Travel & Tourism",
    icon: <MapPin />,
    color: "var(--warning)",
    topics: [
      { id: "airport-travel", title: "Airport & Travel", level: "A2", time: "12 min" },
      { id: "hotel-booking", title: "Hotel Booking", level: "B1", time: "15 min" },
      { id: "restaurant-dining", title: "Restaurant & Dining", level: "A2", time: "12 min" },
    ],
  },
  {
    category: "Health & Wellness",
    icon: <Stethoscope />,
    color: "var(--error)",
    topics: [
      { id: "doctor-visit", title: "Doctor's Visit", level: "B1", time: "15 min" },
      { id: "fitness-health", title: "Fitness & Health", level: "B1", time: "15 min" },
    ],
  },
  {
    category: "Education",
    icon: <BookOpen />,
    color: "var(--accent)",
    topics: [
      { id: "campus-life", title: "Campus Life", level: "B1", time: "15 min" },
      { id: "academic-writing", title: "Academic Writing", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Environment & Society",
    icon: <Globe />,
    color: "var(--success)",
    topics: [
      { id: "climate-change", title: "Climate Change", level: "B2", time: "20 min" },
      { id: "urbanization", title: "Urbanization", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Technology",
    icon: <Laptop />,
    color: "var(--module-reading)",
    topics: [
      { id: "artificial-intelligence", title: "Artificial Intelligence", level: "B2", time: "20 min" },
      { id: "social-media", title: "Social Media Impact", level: "B1", time: "15 min" },
    ],
  },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A2: { bg: "rgba(16, 185, 129, 0.08)", text: "var(--success)", border: "rgba(16, 185, 129, 0.2)" },
  B1: { bg: "var(--accent-light)", text: "var(--accent)", border: "var(--accent-muted)" },
  B2: { bg: "rgba(139, 92, 246, 0.08)", text: "var(--xp)", border: "rgba(139, 92, 246, 0.2)" },
};

interface Props {
  onSelect: (topic: StudyTopic) => void;
  completedTopics: Set<string>;
}

export function TopicSetGrid({ onSelect, completedTopics }: Props) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }} className="anim-fade-up">
      {STUDY_TOPICS.map((cat, catIdx) => {
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const allDone = completedCount === cat.topics.length;

        return (
          <m.div
            key={cat.category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: catIdx * 0.08 }}
          >
            {/* Category header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `2.5px solid ${allDone ? "var(--success)" : cat.color}25`,
              }}
            >
              <span
                style={{
                  display: "grid",
                  width: 38,
                  height: 38,
                  placeItems: "center",
                  borderRadius: 12,
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), #10b981)"
                    : `linear-gradient(135deg, ${cat.color}, ${cat.color}aa)`,
                  fontSize: 18,
                  color: "var(--text-on-accent)",
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${allDone ? "rgba(16, 185, 129, 0.25)" : `${cat.color}25`}`,
                }}
              >
                {allDone ? <CheckCircle style={{ color: "var(--text-on-accent)" }} /> : cat.icon}
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.25,
                  }}
                >
                  {cat.category}
                </h3>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700 }}>
                  {completedCount}/{cat.topics.length} chủ đề đã hoàn thành
                </span>
              </div>
            </div>

            {/* Topic cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 12,
              }}
            >
              {cat.topics.map((topic) => {
                const isDone = completedTopics.has(topic.id);
                const isHovered = hoveredTopic === topic.id;
                const levelStyle = LEVEL_COLORS[topic.level] ?? { bg: "var(--surface-alt)", text: "var(--text-muted)", border: "var(--border)" };

                return (
                  <m.button
                    key={topic.id}
                    onClick={() => onSelect(topic)}
                    onMouseEnter={() => setHoveredTopic(topic.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "16px 18px",
                      borderRadius: "var(--radius-xl)",
                      border: "1.5px solid var(--border)",
                      borderLeft: isDone
                        ? "5px solid var(--success)"
                        : `5px solid ${cat.color}`,
                      background: isDone
                        ? "rgba(16, 185, 129, 0.04)"
                        : isHovered
                        ? "var(--surface-alt)"
                        : "var(--surface)",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isHovered ? "var(--shadow-md)" : "var(--shadow-sm)",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 800,
                          color: "var(--text-primary)",
                          lineHeight: 1.4,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {topic.title}
                      </span>
                      {isDone ? (
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "var(--success)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircle
                            style={{ fontSize: 12, color: "var(--text-on-accent)" }}
                          />
                        </span>
                      ) : (
                        <ChevronRight
                          style={{
                            color: isHovered ? cat.color : "var(--text-muted)",
                            fontSize: 10,
                            marginTop: 4,
                            flexShrink: 0,
                            transition: "color 0.15s",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
                      <span
                        style={{
                          margin: 0,
                          fontSize: 10.5,
                          fontWeight: 900,
                          borderRadius: 6,
                          padding: "2px 8px",
                          background: levelStyle.bg,
                          color: levelStyle.text,
                          border: `1px solid ${levelStyle.border}`,
                        }}
                      >
                        {topic.level}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 650,
                        }}
                      >
                        <Clock size={11} />
                        {topic.time}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontWeight: 650,
                        }}
                      >
                        · 4 bài học
                      </span>
                    </div>
                  </m.button>
                );
              })}
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
