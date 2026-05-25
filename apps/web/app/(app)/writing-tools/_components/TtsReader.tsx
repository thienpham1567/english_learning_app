"use client";

import { useState, useRef, useEffect } from "react";
import {
	SoundOutlined,
	LoadingOutlined,
	PlayCircleOutlined,
	InfoCircleOutlined,
	CloseCircleOutlined
} from "@ant-design/icons";
import * as m from "motion/react-client";

type Accent = "us" | "uk" | "au";
type Gender = "male" | "female";

const ACCENTS: { key: Accent; label: string; flag: string }[] = [
	{ key: "us", label: "Mỹ (US)", flag: "🇺🇸" },
	{ key: "uk", label: "Anh (UK)", flag: "🇬🇧" },
	{ key: "au", label: "Úc (AU)", flag: "🇦🇺" },
];

const GENDERS: { key: Gender; label: string }[] = [
	{ key: "male", label: "Nam (Male)" },
	{ key: "female", label: "Nữ (Female)" },
];

const SPEEDS = [0.75, 1.0, 1.25, 1.5];

export function TtsReader() {
	const [text, setText] = useState("");
	const [accent, setAccent] = useState<Accent>("us");
	const [gender, setGender] = useState<Gender>("female");
	const [speed, setSpeed] = useState(1.0);
	const [loading, setLoading] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const audioUrlRef = useRef<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		return () => {
			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
			}
		};
	}, []);

	const handlePlay = async () => {
		if (!text.trim() || loading) return;
		setError(null);
		setLoading(true);
		setPlaying(false);

		try {
			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
				audioUrlRef.current = null;
			}

			const res = await fetch("/api/voice/synthesize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: text.trim(),
					accent,
					gender,
					speed,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Không thể phát âm văn bản.");
			}

			const blob = await res.blob();
			const audioUrl = URL.createObjectURL(blob);
			audioUrlRef.current = audioUrl;

			const audio = new Audio(audioUrl);
			audioRef.current = audio;

			audio.addEventListener("playing", () => setPlaying(true));
			audio.addEventListener("ended", () => setPlaying(false));
			audio.addEventListener("pause", () => setPlaying(false));
			audio.addEventListener("error", () => {
				setError("Lỗi khi phát tệp âm thanh.");
				setPlaying(false);
			});

			await audio.play();
		} catch (err: any) {
			setError(err.message || "Đã xảy ra lỗi kết nối.");
			setPlaying(false);
		} finally {
			setLoading(false);
		}
	};

	const handleStop = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			setPlaying(false);
		}
	};

	const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
	const isOverLimit = text.length > 200;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="anim-fade-up">
			{/* Text Area Input */}
			<div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
					<span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-secondary)" }}>
						Nhập văn bản cần đọc thành tiếng (Tối đa 200 ký tự)
					</span>
					<span style={{
						fontSize: 11.5,
						fontWeight: 800,
						color: isOverLimit ? "var(--error)" : "var(--text-muted)",
						transition: "color 0.2s"
					}}>
						{text.length}/200 ký tự ({wordCount} từ)
					</span>
				</div>
				<textarea
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						setError(null);
					}}
					placeholder="Type any English phrase, sentence or paragraph here to hear it spoken..."
					maxLength={250}
					className={`app-textarea ${isOverLimit ? "border-error" : ""}`}
					style={{
						width: "100%",
						minHeight: 120,
						padding: 16,
						fontSize: 15,
						lineHeight: 1.7,
						resize: "none",
						fontFamily: "inherit",
					}}
				/>
			</div>

			{/* Configurations Cards Grid */}
			<div style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
				gap: 12
			}}>
				{/* Accent selector */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "14px 16px"
				}}>
					<span style={{ fontSize: 11.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
						Giọng quốc gia
					</span>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						{ACCENTS.map((acc) => {
							const isActive = accent === acc.key;
							return (
								<m.button
									key={acc.key}
									type="button"
									onClick={() => setAccent(acc.key)}
									whileTap={{ scale: 0.98 }}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "8px 12px",
										borderRadius: "var(--radius-lg)",
										border: "none",
										background: isActive ? "var(--accent)" : "var(--surface-alt)",
										color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
										fontWeight: 800,
										fontSize: 13,
										cursor: "pointer",
										textAlign: "left",
										transition: "background 0.2s, color 0.2s"
									}}
								>
									<span>{acc.flag}</span>
									<span>{acc.label}</span>
								</m.button>
							);
						})}
					</div>
				</div>

				{/* Gender selector */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "14px 16px"
				}}>
					<span style={{ fontSize: 11.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
						Giới tính giọng
					</span>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						{GENDERS.map((g) => {
							const isActive = gender === g.key;
							return (
								<m.button
									key={g.key}
									type="button"
									onClick={() => setGender(g.key)}
									whileTap={{ scale: 0.98 }}
									style={{
										padding: "8px 12px",
										borderRadius: "var(--radius-lg)",
										border: "none",
										background: isActive ? "var(--accent)" : "var(--surface-alt)",
										color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
										fontWeight: 800,
										fontSize: 13,
										cursor: "pointer",
										textAlign: "center",
										transition: "background 0.2s, color 0.2s"
									}}
								>
									{g.label}
								</m.button>
							);
						})}
					</div>
				</div>

				{/* Speed selector */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "14px 16px"
				}}>
					<span style={{ fontSize: 11.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
						Tốc độ phát
					</span>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
						{SPEEDS.map((s) => {
							const isActive = speed === s;
							return (
								<m.button
									key={s}
									type="button"
									onClick={() => setSpeed(s)}
									whileTap={{ scale: 0.98 }}
									style={{
										padding: "8px 4px",
										borderRadius: "var(--radius-lg)",
										border: "none",
										background: isActive ? "var(--accent)" : "var(--surface-alt)",
										color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
										fontWeight: 800,
										fontSize: 12.5,
										cursor: "pointer",
										textAlign: "center",
										transition: "background 0.2s, color 0.2s"
									}}
								>
									{s.toFixed(2)}x
								</m.button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Info / Notice Panel */}
			<div style={{
				padding: "12px 14px",
				borderRadius: "var(--radius-lg)",
				background: "rgba(59, 130, 246, 0.05)",
				border: "1.5px solid rgba(59, 130, 246, 0.15)",
				color: "var(--info)",
				fontSize: 12.5,
				lineHeight: 1.5,
				display: "flex",
				alignItems: "flex-start",
				gap: 8
			}}>
				<InfoCircleOutlined style={{ marginTop: 2 }} />
				<div>
					<strong>Công nghệ giọng nói Groq Orpheus:</strong> Chuyển văn bản thành giọng đọc tự nhiên, chất lượng phòng thu chuẩn quốc tế. Giới hạn tối đa 200 ký tự mỗi lần phát âm.
				</div>
			</div>

			{/* Action Control Button */}
			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				<m.button
					type="button"
					onClick={playing ? handleStop : handlePlay}
					disabled={!text.trim() || isOverLimit || loading}
					whileHover={!text.trim() || isOverLimit || loading ? {} : { scale: 1.02 }}
					whileTap={!text.trim() || isOverLimit || loading ? {} : { scale: 0.98 }}
					style={{
						padding: "12px 24px",
						borderRadius: "var(--radius-xl)",
						border: "none",
						background: !text.trim() || isOverLimit || loading ? "var(--border)" : playing ? "var(--error)" : "var(--accent)",
						color: "var(--text-on-accent)",
						fontSize: 14,
						fontWeight: 900,
						cursor: !text.trim() || isOverLimit || loading ? "not-allowed" : "pointer",
						display: "flex",
						alignItems: "center",
						gap: 8,
						boxShadow: !text.trim() || isOverLimit || loading ? "none" : `0 4px 14px ${playing ? "var(--error)" : "var(--accent-muted)"}`,
						transition: "background 0.2s"
					}}
				>
					{loading ? (
						<>
							<LoadingOutlined />
							<span>Đang chuẩn bị giọng nói...</span>
						</>
					) : playing ? (
						<>
							<CloseCircleOutlined />
							<span>Dừng phát âm</span>
						</>
					) : (
						<>
							<PlayCircleOutlined />
							<span>Đọc văn bản (TTS)</span>
						</>
					)}
				</m.button>

				{playing && (
					<m.div
						animate={{
							scale: [1, 1.1, 1],
							opacity: [0.6, 1, 0.6]
						}}
						transition={{
							repeat: Infinity,
							duration: 1.2
						}}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							color: "var(--success)",
							fontSize: 13,
							fontWeight: 800
						}}
					>
						<SoundOutlined />
						<span>Đang phát giọng đọc...</span>
					</m.div>
				)}
			</div>

			{/* Error messages */}
			{error && (
				<m.div
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						padding: "10px 14px",
						borderRadius: "var(--radius-lg)",
						background: "rgba(239, 68, 68, 0.08)",
						color: "var(--error)",
						fontSize: 13,
						fontWeight: 700,
						border: "1.5px solid rgba(239, 68, 68, 0.15)"
					}}
				>
					{error}
				</m.div>
			)}
		</div>
	);
}
