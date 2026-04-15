"use client";

import { LogoutOutlined, DownOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Flex, Typography } from "antd";
import type { MenuProps } from "antd";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/shared/AppShell";

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
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Button
        type="default"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          height: 38,
          paddingLeft: 5,
          paddingRight: 12,
        }}
      >
        <Avatar
          src={user.image || undefined}
          size={28}
          style={
            !user.image ? { background: "var(--accent)", fontSize: 10, fontWeight: 600 } : undefined
          }
        >
          {initials}
        </Avatar>
        <Text strong style={{ fontSize: 14 }}>
          {user.name}
        </Text>
        <DownOutlined style={{ fontSize: 10, color: "var(--text-muted)" }} />
      </Button>
    </Dropdown>
  );
}
