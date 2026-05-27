"use client";

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
import * as m from "motion/react-client";
import type { ReactNode } from "react";
import { useState } from "react";

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
      {
        id: "artificial-intelligence",
        title: "Artificial Intelligence",
        level: "B2",
        time: "20 min",
      },
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
    <div className="anim-fade-up flex flex-col gap-8">
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
              className="flex items-center gap-3 mb-4 pb-3"
              style={{ borderBottom: `2.5px solid ${allDone ? "var(--success)" : cat.color}25` }}
            >
              <span
                className="grid w-[38px] h-[38px] rounded-xl text-lg shrink-0"
                style={{
                  placeItems: "center",
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), #10b981)"
                    : `linear-gradient(135deg, ${cat.color}, ${cat.color}aa)`,
                  color: "var(--text-on-accent)",
                  boxShadow: `0 4px 12px ${allDone ? "rgba(16, 185, 129, 0.25)" : `${cat.color}25`}`,
                }}
              >
                {allDone ? <CheckCircle style={{ color: "var(--text-on-accent)" }} /> : cat.icon}
              </span>
              <div>
                <h3
                  className="m-0 text-base font-black text-text-primary font-display"
                  style={{ lineHeight: 1.25 }}
                >
                  {cat.category}
                </h3>
                <span className="text-text-muted font-bold" style={{ fontSize: 11.5 }}>
                  {completedCount}/{cat.topics.length} topics completed
                </span>
              </div>
            </div>

            {/* Topic cards grid */}
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
            >
              {cat.topics.map((topic) => {
                const isDone = completedTopics.has(topic.id);
                const isHovered = hoveredTopic === topic.id;
                const levelStyle = LEVEL_COLORS[topic.level] ?? {
                  bg: "var(--surface-alt)",
                  text: "var(--text-muted)",
                  border: "var(--border)",
                };

                return (
                  <m.button
                    key={topic.id}
                    onClick={() => onSelect(topic)}
                    onMouseEnter={() => setHoveredTopic(topic.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col justify-between gap-3 rounded-(--radius-xl) cursor-pointer text-left"
                    style={{
                      padding: "16px 18px",
                      border: "1.5px solid var(--border)",
                      borderLeft: isDone ? "5px solid var(--success)" : `5px solid ${cat.color}`,
                      background: isDone
                        ? "rgba(16, 185, 129, 0.04)"
                        : isHovered
                          ? "var(--surface-alt)"
                          : "var(--surface)",
                      boxShadow: isHovered ? "var(--shadow-md)" : "var(--shadow-sm)",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2.5 w-full">
                      <span
                        className="font-extrabold text-text-primary font-body"
                        style={{ fontSize: 14.5, lineHeight: 1.4 }}
                      >
                        {topic.title}
                      </span>
                      {isDone ? (
                        <span
                          className="w-[20px] h-[20px] rounded-full grid shrink-0"
                          style={{ background: "var(--success)", placeItems: "center" }}
                        >
                          <CheckCircle
                            className="text-xs"
                            style={{ color: "var(--text-on-accent)" }}
                          />
                        </span>
                      ) : (
                        <ChevronRight
                          className="text-[10px] mt-1 shrink-0"
                          style={{
                            color: isHovered ? cat.color : "var(--text-muted)",
                            transition: "color 0.15s",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full">
                      <span
                        className="m-0 text-[10.5px] font-black rounded-md"
                        style={{
                          padding: "2px 8px",
                          background: levelStyle.bg,
                          color: levelStyle.text,
                          border: `1px solid ${levelStyle.border}`,
                        }}
                      >
                        {topic.level}
                      </span>
                      <span
                        className="text-[11px] text-text-muted flex items-center gap-1"
                        style={{ fontWeight: 650 }}
                      >
                        <Clock size={11} />
                        {topic.time}
                      </span>
                      <span className="text-[11px] text-text-muted" style={{ fontWeight: 650 }}>
                        · 4 lessons
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
