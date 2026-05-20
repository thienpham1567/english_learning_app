import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { HubWidgets } from "./_components/HubWidgets";
import { QuickActions } from "./_components/QuickActions";

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
			<ModuleHeader
				icon={<TrophyOutlined />}
				gradient="var(--gradient-toeic-skills)"
				title="TOEIC"
				subtitle="Target 800–900 · Lộ trình 16 tuần"
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				<HubWidgets />
				<QuickActions />
			</div>
		</div>
	);
}
