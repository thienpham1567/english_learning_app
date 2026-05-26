
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { HubWidgets } from "./_components/HubWidgets";
import { QuickActions } from "./_components/QuickActions";
import { Trophy } from "lucide-react";

export default async function ToeicHubPage() {
	await requireToeicBaseline();

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-4" >
				<HubWidgets />
				<QuickActions />
			</div>
		</div>
	);
}
