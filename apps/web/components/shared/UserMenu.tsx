"use client";

import { LogoutOutlined, DownOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Typography } from "antd";
import type { MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/shared/AppShell";
import * as m from "motion/react-client";

const { Text } = Typography;

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const items: MenuProps["items"] = [
    {
      key: "sign-out",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleSignOut,
    },
  ];

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight" overlayClassName="user-menu-dropdown">
      <m.button
        whileHover={{ background: "var(--bg-deep)" }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 999,
          height: 40,
          paddingLeft: 6,
          paddingRight: 14,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Avatar
            src={user.image || undefined}
            size={28}
            style={
              !user.image ? { background: "var(--accent)", fontSize: 10, fontWeight: 700, border: "2px solid rgba(255,255,255,0.1)" } : undefined
            }
          >
            {initials}
          </Avatar>
        </m.div>
        <Text strong style={{ fontSize: 13, color: "var(--ink)" }}>
          {user.name}
        </Text>
        <DownOutlined style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 2 }} />
      </m.button>
    </Dropdown>
  );
}
