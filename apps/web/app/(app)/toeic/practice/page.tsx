
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { PracticeRunner } from "./_components/PracticeRunner";
import { Trophy } from "lucide-react";

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
			<div style={{ padding: 16, flex: 1 }}>
				<PracticeRunner />
			</div>
		</div>
	);
}
