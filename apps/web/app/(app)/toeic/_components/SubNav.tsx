"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as m from "motion/react-client";

const TABS = [
	{ href: "/toeic", label: "Tổng quan" },
	{ href: "/toeic/practice", label: "Luyện đề" },
	{ href: "/toeic/skills", label: "Skills" },
];

export function SubNav() {
	const pathname = usePathname();
	if (pathname?.startsWith("/toeic/diagnostic")) return null;

	return (
		<m.nav
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			style={{
				display: "flex",
				gap: 4,
				padding: "8px 12px",
				overflowX: "auto",
				flexShrink: 0,
			}}
		>
			{TABS.map((t) => {
				const active =
					pathname === t.href || (t.href !== "/toeic" && pathname?.startsWith(t.href));
				return (
					<m.div
						key={t.href}
						whileHover={{ y: -1 }}
						whileTap={{ scale: 0.97 }}
					>
						<Link
							href={t.href}
							style={{
								display: "block",
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
					</m.div>
				);
			})}
		</m.nav>
	);
}
