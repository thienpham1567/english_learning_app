"use client";

import { CheckCircleOutlined, ClockCircleOutlined, RightOutlined } from "@ant-design/icons";
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {STUDY_TOPICS.map((cat) => (
        <div key={cat.category}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{cat.icon}</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{cat.category}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {cat.topics.map((topic) => {
              const isDone = completedTopics.has(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelect(topic)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: 16, borderRadius: 12,
                    border: isDone ? "1.5px solid #52c41a" : "1px solid var(--border)",
                    background: isDone ? "#52c41a08" : "var(--card-bg)",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                      {topic.title}
                    </span>
                    {isDone ? (
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                    ) : (
                      <RightOutlined style={{ color: "var(--text-muted)", fontSize: 11 }} />
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag color={LEVEL_COLORS[topic.level] ?? "default"} style={{ margin: 0, fontSize: 11 }}>
                      {topic.level}
                    </Tag>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                      <ClockCircleOutlined style={{ fontSize: 10 }} /> {topic.time}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>4 phần</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
