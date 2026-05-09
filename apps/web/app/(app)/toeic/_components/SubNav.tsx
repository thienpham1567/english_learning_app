"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
	{ href: "/toeic", label: "Tổng quan" },
	{ href: "/toeic/practice", label: "Luyện đề" },
	{ href: "/toeic/skills", label: "Skills" },
];

export function SubNav() {
	const pathname = usePathname();
	if (pathname?.startsWith("/toeic/diagnostic")) return null;

	return (
		<nav
			style={{
				display: "flex",
				gap: 4,
				padding: "8px 12px",
				borderBottom: "1px solid var(--border-color, #1f2937)",
				overflowX: "auto",
				flexShrink: 0,
			}}
		>
			{TABS.map((t) => {
				const active =
					pathname === t.href || (t.href !== "/toeic" && pathname?.startsWith(t.href));
				return (
					<Link
						key={t.href}
						href={t.href}
						style={{
							padding: "6px 12px",
							borderRadius: 8,
							color: active ? "var(--text-primary, #fff)" : "var(--text-muted, #94a3b8)",
							background: active ? "var(--surface-hover, #1f2937)" : "transparent",
							fontWeight: active ? 600 : 400,
							textDecoration: "none",
							whiteSpace: "nowrap",
							fontSize: 14,
						}}
					>
						{t.label}
					</Link>
				);
			})}
		</nav>
	);
}
