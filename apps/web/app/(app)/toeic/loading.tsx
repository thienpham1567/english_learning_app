"use client";
import { Loader2 } from "lucide-react";

export default function ToeicLoading() {
	return (
		<div className="flex flex-col items-center justify-center flex-1 gap-3.5" style={{padding: 64}} >
			<Loader2 className="animate-spin text-accent" size={28}
			/>
			<span className="text-sm font-bold text-text-muted" >
				Đang tải...
			</span>
		</div>
	);
}
