"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
	CompassOutlined,
	NumberOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
	CustomerServiceOutlined,
	ReadOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";

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
		icon: <CustomerServiceOutlined />,
		color: "var(--module-listening)",
	},
	{
		value: "reading",
		label: "Reading",
		icon: <ReadOutlined />,
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
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				marginBottom: 12,
			}}
		>
			<span
				style={{
					fontSize: 15,
					color: "var(--accent)",
					display: "grid",
					placeItems: "center",
				}}
			>
				{icon}
			</span>
			<span
				style={{
					fontSize: 13,
					fontWeight: 800,
					color: "var(--text-primary)",
					letterSpacing: "-0.01em",
				}}
			>
				{text}
			</span>
			{badge && (
				<span
					style={{
						fontSize: 10,
						fontWeight: 700,
						color: "var(--accent)",
						background: "var(--accent-light)",
						padding: "2px 8px",
						borderRadius: 99,
						marginLeft: "auto",
					}}
				>
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
			whileTap={{ scale: 0.95 }}
			style={{
				flex: "0 0 auto",
				padding: "8px 16px",
				borderRadius: 12,
				border: active
					? `1.5px solid ${color}`
					: "1.5px solid var(--border)",
				background: active
					? `color-mix(in srgb, ${color} 12%, transparent)`
					: "var(--surface-alt)",
				color: active ? color : "var(--text-secondary)",
				cursor: "pointer",
				fontSize: 12.5,
				fontWeight: active ? 800 : 600,
				display: "flex",
				alignItems: "center",
				gap: 5,
				transition: "all 0.2s ease",
				whiteSpace: "nowrap",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{children}
			{active && (
				<m.div
					layoutId="chip-glow"
					style={{
						position: "absolute",
						inset: 0,
						borderRadius: 12,
						background: `radial-gradient(circle at center, color-mix(in srgb, ${color} 8%, transparent), transparent)`,
						pointerEvents: "none",
					}}
				/>
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
			whileHover={{ y: -2 }}
			style={{
				position: "relative",
				flex: 1,
				padding: "14px 0",
				borderRadius: 14,
				border: active
					? "1.5px solid var(--accent)"
					: "1.5px solid var(--border)",
				background: active ? "var(--accent)" : "var(--surface-alt)",
				color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 2,
				transition: "all 0.25s ease",
				boxShadow: active
					? "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)"
					: "none",
			}}
		>
			<span
				style={{
					fontSize: 18,
					fontWeight: 900,
					lineHeight: 1,
					fontFamily: "var(--font-display)",
				}}
			>
				{value}
			</span>
			<span
				style={{
					fontSize: 10,
					fontWeight: 700,
					opacity: active ? 0.85 : 0.6,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
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
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			style={{
				maxWidth: 620,
				width: "100%",
				margin: "20px auto",
			}}
		>
			{/* ── Glass card ── */}
			<div
				style={{
					background:
						"color-mix(in srgb, var(--surface) 85%, transparent)",
					backdropFilter: "blur(20px)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-2xl)",
					padding: "28px 28px 24px",
					boxShadow: "var(--shadow-lg)",
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Ambient glow */}
				<div
					style={{
						position: "absolute",
						top: -60,
						right: -60,
						width: 200,
						height: 200,
						borderRadius: "50%",
						background:
							"radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)",
						pointerEvents: "none",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: -80,
						left: -40,
						width: 180,
						height: 180,
						borderRadius: "50%",
						background:
							"radial-gradient(circle, color-mix(in srgb, var(--info) 6%, transparent), transparent 70%)",
						pointerEvents: "none",
					}}
				/>

				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 14,
						marginBottom: 28,
						position: "relative",
					}}
				>
					<m.div
						whileHover={{ rotate: 15, scale: 1.08 }}
						transition={{ type: "spring", stiffness: 400 }}
						style={{
							width: 44,
							height: 44,
							borderRadius: 14,
							background:
								"linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #FFD700))",
							boxShadow:
								"0 6px 20px color-mix(in srgb, var(--accent) 25%, transparent)",
							display: "grid",
							placeItems: "center",
							color: "var(--text-on-accent)",
							fontSize: 20,
							flexShrink: 0,
						}}
					>
						<TrophyOutlined />
					</m.div>
					<div>
						<h3
							style={{
								margin: 0,
								fontSize: 18,
								fontWeight: 900,
								color: "var(--ink)",
								fontFamily: "var(--font-display)",
								letterSpacing: "-0.02em",
								lineHeight: 1.2,
							}}
						>
							Cấu hình luyện đề
						</h3>
						<p
							style={{
								margin: "3px 0 0",
								fontSize: 12,
								color: "var(--text-muted)",
								fontWeight: 600,
							}}
						>
							Chọn đề, phần thi và số câu để bắt đầu
						</p>
					</div>
				</div>

				{/* ── Section 1: Exam selection ── */}
				<div style={{ position: "relative", marginBottom: 24 }}>
					<SectionLabel
						icon={<TrophyOutlined />}
						text="Đề thi TOEIC"
						badge={`${exams.length + 1} đề`}
					/>
					<div
						style={{
							display: "flex",
							gap: 8,
							overflowX: "auto",
							paddingBottom: 4,
							scrollbarWidth: "none",
							WebkitOverflowScrolling: "touch",
						}}
					>
						<Chip
							active={selectedExam === "random"}
							onClick={() => setSelectedExam("random")}
						>
							<span style={{ fontSize: 14 }}>🎲</span>
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
					<div
						style={{
							position: "absolute",
							top: 32,
							right: 0,
							bottom: 4,
							width: 40,
							background:
								"linear-gradient(90deg, transparent, color-mix(in srgb, var(--surface) 85%, transparent))",
							pointerEvents: "none",
							borderRadius: "0 12px 12px 0",
						}}
					/>
				</div>

				{/* Divider */}
				<div
					style={{
						height: 1,
						background:
							"linear-gradient(90deg, transparent, var(--border), transparent)",
						marginBottom: 24,
					}}
				/>

				{/* ── Section 2: Part selection ── */}
				<div style={{ marginBottom: 24 }}>
					<SectionLabel
						icon={<CompassOutlined />}
						text="Phần thi (Part)"
					/>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
							gap: 8,
						}}
					>
						{PARTS.map((p) => (
							<Chip
								key={p.value}
								active={selectedPart === p.value}
								onClick={() => setSelectedPart(p.value)}
								accentColor={p.color}
							>
								{p.icon && (
									<span style={{ fontSize: 13 }}>{p.icon}</span>
								)}
								{p.label}
							</Chip>
						))}
					</div>
				</div>

				{/* Divider */}
				<div
					style={{
						height: 1,
						background:
							"linear-gradient(90deg, transparent, var(--border), transparent)",
						marginBottom: 24,
					}}
				/>

				{/* ── Section 3: Count selection ── */}
				<div style={{ marginBottom: 28 }}>
					<SectionLabel
						icon={<NumberOutlined />}
						text="Số lượng câu hỏi"
					/>
					<div style={{ display: "flex", gap: 10 }}>
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
					}
					style={{
						width: "100%",
						padding: "16px",
						background:
							"linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #FFD700))",
						color: "var(--text-on-accent)",
						fontSize: 15,
						fontWeight: 900,
						border: "none",
						borderRadius: "var(--radius-lg)",
						cursor: "pointer",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: 10,
						boxShadow:
							"0 4px 18px color-mix(in srgb, var(--accent) 30%, transparent)",
						position: "relative",
						overflow: "hidden",
						letterSpacing: "-0.01em",
					}}
				>
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
						}}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "40%",
							height: "100%",
							background:
								"linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
							pointerEvents: "none",
						}}
					/>
					<ThunderboltOutlined style={{ fontSize: 16 }} />
					<span>Bắt đầu luyện tập ngay</span>
				</m.button>

				{/* ── Summary badge ── */}
				<div
					style={{
						marginTop: 16,
						display: "flex",
						justifyContent: "center",
						gap: 16,
						flexWrap: "wrap",
					}}
				>
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
							key={s.label}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 5,
								fontSize: 11,
								color: "var(--text-muted)",
								fontWeight: 600,
							}}
						>
							<span
								style={{
									width: 4,
									height: 4,
									borderRadius: "50%",
									background: "var(--accent)",
									opacity: 0.6,
								}}
							/>
							<span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
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
