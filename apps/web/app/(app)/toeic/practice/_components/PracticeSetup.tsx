"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

import * as m from "motion/react-client";
import {
  BookOpenText,
  Compass,
  Hash,
  Headphones,
  Trophy,
  Zap,
} from "lucide-react";

/* ── Part chips ── */
const PARTS: Array<{
	value: string;
	label: string;
	icon?: React.ReactNode;
	color?: string;
}> = [
	{ value: "all", label: "Tất cả" },
	{
		value: "listening",
		label: "Listening",
		icon: <Headphones />,
		color: "var(--module-listening)",
	},
	{
		value: "reading",
		label: "Reading",
		icon: <BookOpenText />,
		color: "var(--module-reading)",
	},
	{ value: "3", label: "Part 3" },
	{ value: "4", label: "Part 4" },
	{ value: "5", label: "Part 5" },
	{ value: "6", label: "Part 6" },
	{ value: "7", label: "Part 7" },
];

function parsePart(v: string): number | "listening" | "reading" | "all" {
	if (v === "all" || v === "listening" || v === "reading") return v;
	const n = parseInt(v, 10);
	return Number.isFinite(n) ? n : "all";
}

const COUNTS = [10, 15, 20, 30];

export type PracticeStartParams = {
	mode: "practice";
	examCode?: string;
	part?: number | "listening" | "reading" | "all";
	count: number;
};

type ExamRow = { code: string; title: string; year: number | null };

/* ── Section label ── */
function SectionLabel({
	icon,
	text,
	badge,
}: {
	icon: React.ReactNode;
	text: string;
	badge?: string;
}) {
	return (
		<div className="flex items-center gap-2 mb-3" >
			<span className="text-[15px] text-accent grid" style={{placeItems: "center"}} >
				{icon}
			</span>
			<span className="text-[13px] font-extrabold text-text-primary" style={{letterSpacing: "-0.01em"}} >
				{text}
			</span>
			{badge && (
				<span className="text-[10px] font-bold text-accent rounded-full" style={{background: "var(--accent-light)", padding: "2px 8px", marginLeft: "auto"}} >
					{badge}
				</span>
			)}
		</div>
	);
}

/* ── Chip button ── */
function Chip({
	active,
	onClick,
	children,
	accentColor,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
	accentColor?: string;
}) {
	const color = accentColor || "var(--accent)";
	return (
		<m.button
			type="button"
			onClick={onClick}
			whileTap={{ scale: 0.95 }} className="py-2 px-4 rounded-xl cursor-pointer flex items-center relative overflow-hidden" style={{flex: "0 0 auto", border: active
					? `1.5px solid ${color}`
					: "1.5px solid var(--border)", background: active
					? `color-mix(in srgb, ${color} 12%, transparent)`
					: "var(--surface-alt)", color: active ? color : "var(--text-secondary)", fontSize: 12.5, fontWeight: active ? 800 : 600, gap: 5, transition: "all 0.2s ease", whiteSpace: "nowrap"}} >
			{children}
			{active && (
				<m.div
					layoutId="chip-glow" className="absolute rounded-xl" style={{inset: 0, background: `radial-gradient(circle at center, color-mix(in srgb, ${color} 8%, transparent), transparent)`, pointerEvents: "none"}} />
			)}
		</m.button>
	);
}

/* ── Count button ── */
function CountBtn({
	value,
	active,
	onClick,
}: {
	value: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<m.button
			type="button"
			onClick={onClick}
			whileTap={{ scale: 0.92 }}
			whileHover={{ y: -2 }} className="relative flex-1 cursor-pointer flex flex-col items-center" style={{padding: "14px 0", borderRadius: 14, border: active
					? "1.5px solid var(--accent)"
					: "1.5px solid var(--border)", background: active ? "var(--accent)" : "var(--surface-alt)", color: active ? "var(--text-on-accent)" : "var(--text-secondary)", gap: 2, transition: "all 0.25s ease", boxShadow: active
					? "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)"
					: "none"}} >
			<span className="text-lg font-black leading-none font-display" >
				{value}
			</span>
			<span className="text-[10px] font-bold uppercase tracking-wider" style={{opacity: active ? 0.85 : 0.6}} >
				câu
			</span>
		</m.button>
	);
}

/* ════════════════════════════════════════════════
   PRACTICE SETUP — Main Component
   ════════════════════════════════════════════════ */
export function PracticeSetup({
	onStart,
}: {
	onStart: (params: PracticeStartParams) => void;
}) {
	const [exams, setExams] = useState<ExamRow[]>([]);
	const [selectedExam, setSelectedExam] = useState<string>("random");
	const [selectedPart, setSelectedPart] = useState<string>("all");
	const [count, setCount] = useState(10);

	useEffect(() => {
		void api
			.get<{ exams: ExamRow[] }>("/toeic-practice/exams")
			.then((res) =>
				setExams(res.exams.filter((e) => e.code !== "diagnostic_v1")),
			)
			.catch(() => setExams([]));
	}, []);

	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="w-[620px] w-full" style={{margin: "20px auto"}} >
			{/* ── Glass card ── */}
			<div className="rounded-(--radius-2xl) relative overflow-hidden" style={{background: "color-mix(in srgb, var(--surface) 85%, transparent)", backdropFilter: "blur(20px)", border: "1.5px solid var(--border)", padding: "28px 28px 24px", boxShadow: "var(--shadow-lg)"}} >
				{/* Ambient glow */}
				<div className="absolute w-[200px] h-[200px] rounded-full" style={{top: -60, right: -60, background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)", pointerEvents: "none"}} />
				<div className="absolute w-[180px] h-[180px] rounded-full" style={{bottom: -80, left: -40, background: "radial-gradient(circle, color-mix(in srgb, var(--info) 6%, transparent), transparent 70%)", pointerEvents: "none"}} />

				{/* Header */}
				<div className="flex items-center gap-3.5 relative" style={{marginBottom: 28}} >
					<m.div
						whileHover={{ rotate: 15, scale: 1.08 }}
						transition={{ type: "spring", stiffness: 400 }} className="w-[44px] h-[44px] grid text-xl shrink-0" style={{borderRadius: 14, background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #FFD700))", boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 25%, transparent)", placeItems: "center", color: "var(--text-on-accent)"}} >
						<Trophy />
					</m.div>
					<div>
						<h3 className="m-0 text-lg font-black text-ink font-display tracking-tight" style={{lineHeight: 1.2}} >
							Cấu hình luyện đề
						</h3>
						<p className="text-xs text-text-muted font-semibold" style={{margin: "3px 0 0"}} >
							Chọn đề, phần thi và số câu để bắt đầu
						</p>
					</div>
				</div>

				{/* ── Section 1: Exam selection ── */}
				<div className="relative mb-6" >
					<SectionLabel
						icon={<Trophy />}
						text="Đề thi TOEIC"
						badge={`${exams.length + 1} đề`}
					/>
					<div className="flex gap-2 pb-1" style={{overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch"}} >
						<Chip
							active={selectedExam === "random"}
							onClick={() => setSelectedExam("random")}
						>
							<span className="text-sm" >🎲</span>
							Ngẫu nhiên
						</Chip>
						{exams.map((e) => (
							<Chip
								key={e.code}
								active={selectedExam === e.code}
								onClick={() => setSelectedExam(e.code)}
							>
								{e.title}
							</Chip>
						))}
					</div>
					{/* Fade edge hint for scroll */}
					<div className="absolute w-[40px]" style={{top: 32, right: 0, bottom: 4, background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--surface) 85%, transparent))", pointerEvents: "none", borderRadius: "0 12px 12px 0"}} />
				</div>

				{/* Divider */}
				<div className="h-[1px] mb-6" style={{background: "linear-gradient(90deg, transparent, var(--border), transparent)"}} />

				{/* ── Section 2: Part selection ── */}
				<div className="mb-6" >
					<SectionLabel
						icon={<Compass />}
						text="Phần thi (Part)"
					/>
					<div className="grid gap-2" style={{gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))"}} >
						{PARTS.map((p) => (
							<Chip
								key={p.value}
								active={selectedPart === p.value}
								onClick={() => setSelectedPart(p.value)}
								accentColor={p.color}
							>
								{p.icon && (
									<span className="text-[13px]" >{p.icon}</span>
								)}
								{p.label}
							</Chip>
						))}
					</div>
				</div>

				{/* Divider */}
				<div className="h-[1px] mb-6" style={{background: "linear-gradient(90deg, transparent, var(--border), transparent)"}} />

				{/* ── Section 3: Count selection ── */}
				<div style={{ marginBottom: 28 }}>
					<SectionLabel
						icon={<Hash />}
						text="Số lượng câu hỏi"
					/>
					<div className="flex gap-2.5" >
						{COUNTS.map((c) => (
							<CountBtn
								key={c}
								value={c}
								active={count === c}
								onClick={() => setCount(c)}
							/>
						))}
					</div>
				</div>

				{/* ── CTA Button ── */}
				<m.button
					type="button"
					whileHover={{
						y: -2,
						boxShadow:
							"0 8px 28px color-mix(in srgb, var(--accent) 40%, transparent)",
					}}
					whileTap={{ scale: 0.98 }}
					transition={{ type: "spring", stiffness: 400, damping: 22 }}
					onClick={() =>
						onStart({
							mode: "practice",
							examCode:
								selectedExam === "random"
									? undefined
									: selectedExam,
							part: parsePart(selectedPart),
							count,
						})
					} className="w-full p-4 text-[15px] font-black border-none rounded-(--radius-lg) cursor-pointer flex justify-center items-center gap-2.5 relative overflow-hidden" style={{background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #FFD700))", color: "var(--text-on-accent)", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 30%, transparent)", letterSpacing: "-0.01em"}} >
					{/* Shimmer overlay */}
					<m.div
						animate={{
							x: ["-100%", "200%"],
						}}
						transition={{
							duration: 3,
							repeat: Infinity,
							ease: "linear",
							repeatDelay: 2,
						}} className="absolute h-full" style={{top: 0, left: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", pointerEvents: "none"}} />
					<Zap size={16} />
					<span>Bắt đầu luyện tập ngay</span>
				</m.button>

				{/* ── Summary badge ── */}
				<div className="mt-4 flex justify-center gap-4 flex-wrap" >
					{[
						{
							label: "Đề",
							value:
								selectedExam === "random"
									? "Ngẫu nhiên"
									: exams.find((e) => e.code === selectedExam)
											?.title || selectedExam,
						},
						{
							label: "Phần",
							value:
								PARTS.find((p) => p.value === selectedPart)
									?.label || selectedPart,
						},
						{ label: "Câu", value: `${count}` },
					].map((s) => (
						<div
							key={s.label} className="flex items-center text-[11px] text-text-muted font-semibold" style={{gap: 5}} >
							<span className="w-[4px] h-[4px] rounded-full" style={{background: "var(--accent)", opacity: 0.6}} />
							<span className="font-bold text-text-secondary" >
								{s.label}:
							</span>
							<span>{s.value}</span>
						</div>
					))}
				</div>
			</div>
		</m.div>
	);
}
