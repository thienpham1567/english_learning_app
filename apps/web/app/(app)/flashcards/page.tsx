import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { FlashcardSession } from "@/app/(app)/flashcards/_components/FlashcardSession";

export default function FlashcardsPage() {
  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="px-5 pt-3.5 shrink-0 max-w-5xl mx-auto w-full">
        <RoadmapBanner />
      </div>
      <FlashcardSession />
    </div>
  );
}
