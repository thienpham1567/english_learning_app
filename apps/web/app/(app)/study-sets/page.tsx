"use client";

import { useState } from "react";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { TopicSetGrid } from "@/app/(app)/study-sets/_components/TopicSetGrid";
import { StudySetView } from "@/app/(app)/study-sets/_components/StudySetView";
import type { StudyTopic } from "@/app/(app)/study-sets/_components/TopicSetGrid";
import { Compass } from "lucide-react";

export default function StudySetsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<StudyTopic | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  return (
    <div className="relative flex h-full h-[0px] flex-1 flex-col overflow-hidden" >

      {/* Content */}
      <div className="relative h-[0px] flex-1 overflow-y-auto" style={{padding: "20px 16px"}} >
        <div className="absolute" style={{pointerEvents: "none", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)"}} />
        <div className="relative mx-auto w-[700px] w-full" >
          {activeTopic ? (
            <StudySetView
              topicId={activeTopic.id}
              topicTitle={activeTopic.title}
              level={activeTopic.level}
              examMode={examMode}
              onBack={() => setActiveTopic(null)}
              onComplete={(id) => setCompletedTopics((prev) => new Set(prev).add(id))}
            />
          ) : (
            <TopicSetGrid
              onSelect={setActiveTopic}
              completedTopics={completedTopics}
            />
          )}
        </div>
      </div>
    </div>
  );
}
