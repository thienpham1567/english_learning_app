import { Trophy } from "lucide-react";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { PracticeRunner } from "./_components/PracticeRunner";

export default async function PracticePage() {
  await requireToeicBaseline();

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 flex-1">
        <PracticeRunner />
      </div>
    </div>
  );
}
