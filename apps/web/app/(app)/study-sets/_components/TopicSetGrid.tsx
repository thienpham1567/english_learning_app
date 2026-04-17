"use client";

import { useState } from "react";
import { CheckCircleOutlined, RightOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Tag } from "antd";

export type StudyTopic = {
  id: string;
  title: string;
  level: string;
  time: string;
};

export type StudyCategory = {
  category: string;
  icon: string;
  color: string;
  topics: StudyTopic[];
};

export const STUDY_TOPICS: StudyCategory[] = [
  {
    category: "Business & Office",
    icon: "🏢",
    color: "#6366f1",
    topics: [
      { id: "business-meetings", title: "Business Meetings", level: "B1", time: "15 min" },
      { id: "email-writing", title: "Email Writing", level: "B1", time: "15 min" },
      { id: "job-interview", title: "Job Interviews", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Travel & Tourism",
    icon: "✈️",
    color: "#f59e0b",
    topics: [
      { id: "airport-travel", title: "Airport & Travel", level: "A2", time: "12 min" },
      { id: "hotel-booking", title: "Hotel Booking", level: "B1", time: "15 min" },
      { id: "restaurant-dining", title: "Restaurant & Dining", level: "A2", time: "12 min" },
    ],
  },
  {
    category: "Health & Wellness",
    icon: "🏥",
    color: "#ef4444",
    topics: [
      { id: "doctor-visit", title: "Doctor's Visit", level: "B1", time: "15 min" },
      { id: "fitness-health", title: "Fitness & Health", level: "B1", time: "15 min" },
    ],
  },
  {
    category: "Education",
    icon: "🎓",
    color: "#8b5cf6",
    topics: [
      { id: "campus-life", title: "Campus Life", level: "B1", time: "15 min" },
      { id: "academic-writing", title: "Academic Writing", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Environment & Society",
    icon: "🌍",
    color: "#10b981",
    topics: [
      { id: "climate-change", title: "Climate Change", level: "B2", time: "20 min" },
      { id: "urbanization", title: "Urbanization", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Technology",
    icon: "💻",
    color: "#0ea5e9",
    topics: [
      { id: "artificial-intelligence", title: "Artificial Intelligence", level: "B2", time: "20 min" },
      { id: "social-media", title: "Social Media Impact", level: "B1", time: "15 min" },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = { A2: "green", B1: "blue", B2: "purple" };

interface Props {
  onSelect: (topic: StudyTopic) => void;
  completedTopics: Set<string>;
}

export function TopicSetGrid({ onSelect, completedTopics }: Props) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {STUDY_TOPICS.map((cat) => {
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const allDone = completedCount === cat.topics.length;

        return (
          <div key={cat.category}>
            {/* Category header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                paddingBottom: 10,
                borderBottom: `2px solid ${cat.color}30`,
              }}
            >
              <span
                style={{
                  display: "grid",
                  width: 36,
                  height: 36,
                  placeItems: "center",
                  borderRadius: 10,
                  background: allDone
                    ? "linear-gradient(135deg, #52c41a, #22c55e)"
                    : `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)`,
                  fontSize: 18,
                  flexShrink: 0,
                  boxShadow: `0 2px 6px ${cat.color}40`,
                }}
              >
                {allDone ? "✅" : cat.icon}
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    lineHeight: 1.2,
                  }}
                >
                  {cat.category}
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                  {completedCount}/{cat.topics.length} hoàn thành
                </span>
              </div>
            </div>

            {/* Topic cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {cat.topics.map((topic) => {
                const isDone = completedTopics.has(topic.id);
                const isHovered = hoveredTopic === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => onSelect(topic)}
                    onMouseEnter={() => setHoveredTopic(topic.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      padding: "14px 16px 14px 18px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      borderLeft: isDone
                        ? "4px solid #52c41a"
                        : `4px solid ${cat.color}`,
                      background: isDone
                        ? "rgba(82, 196, 26, 0.06)"
                        : isHovered
                        ? `${cat.color}08`
                        : "var(--card-bg)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.18s ease",
                      transform: isHovered ? "translateY(-2px)" : "none",
                      boxShadow: isHovered
                        ? `0 4px 14px ${isDone ? "rgba(82,196,26,0.15)" : `${cat.color}25`}`
                        : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--text)",
                          lineHeight: 1.35,
                        }}
                      >
                        {topic.title}
                      </span>
                      {isDone ? (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 99,
                            background: "#52c41a",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircleOutlined
                            style={{ fontSize: 13, color: "#fff" }}
                          />
                        </span>
                      ) : (
                        <RightOutlined
                          style={{
                            color: isHovered ? cat.color : "var(--text-muted)",
                            fontSize: 11,
                            marginTop: 2,
                            flexShrink: 0,
                            transition: "color 0.15s",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Tag
                        color={LEVEL_COLORS[topic.level] ?? "default"}
                        style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
                      >
                        {topic.level}
                      </Tag>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <ClockCircleOutlined style={{ fontSize: 10 }} />
                        {topic.time}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        · 4 phần
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
