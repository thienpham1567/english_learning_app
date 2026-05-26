
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { HubWidgets } from "./_components/HubWidgets";
import { QuickActions } from "./_components/QuickActions";
import { Trophy } from "lucide-react";

export default async function ToeicHubPage() {
	await requireToeicBaseline();

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				flex: 1,
				overflow: "auto",
			}}
		>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				<HubWidgets />
				<QuickActions />
			</div>
		</div>
	);
}
