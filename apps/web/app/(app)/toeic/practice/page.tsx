import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { PracticeRunner } from "./_components/PracticeRunner";

export default async function PracticePage() {
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
				gradient="var(--gradient-mock-test)"
				title="TOEIC Practice"
				subtitle="Luyện đề ETS · Part 3-7"
			/>
			<div style={{ padding: 16, flex: 1 }}>
				<PracticeRunner />
			</div>
		</div>
	);
}
