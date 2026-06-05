"use client";

import {
  BarChartOutlined,
  BookOutlined,
  HistoryOutlined,
  LogoutOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { UserRole } from "@/entities/user";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const { Header, Sider, Content, Footer } = Layout;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
};

const allMenuItems: MenuItem[] = [
  {
    key: "/journal",
    icon: <BookOutlined />,
    label: "Журнал",
    roles: ["TEACHER"],
  },
  {
    key: "/journal/history",
    icon: <HistoryOutlined />,
    label: "История шагов",
    roles: ["TEACHER"],
  },
  {
    key: "/groups",
    icon: <TeamOutlined />,
    label: "Группы",
    roles: ["TEACHER", "MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/analytics",
    icon: <BarChartOutlined />,
    label: "Аналитика",
    roles: ["TEACHER", "MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/student/me",
    icon: <UserOutlined />,
    label: "Мой прогресс",
    roles: ["STUDENT"],
  },
  {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: "Пользователи",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/admin/groups",
    icon: <TeamOutlined />,
    label: "Группы (админ)",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/admin/program",
    icon: <BookOutlined />,
    label: "Программа",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/admin/awards",
    icon: <TrophyOutlined />,
    label: "Награды",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo(() => {
    const role = session?.user.role;
    if (!role) return [];
    return allMenuItems
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }));
  }, [session?.user.role]);

  const selectedKey =
    menuItems
      .filter(
        (item) =>
          pathname === item.key || pathname.startsWith(`${item.key}/`),
      )
      .sort((a, b) => b.key.length - a.key.length)[0]?.key ??
    menuItems[0]?.key;

  return (
    <Layout
      className="h-screen min-h-screen"
      style={{ minHeight: "100vh", height: "100vh" }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        className="!h-full !bg-[#12100e]"
      >
        <div className="flex h-16 items-center justify-center px-4">
          <Link
            href="/dashboard"
            className="font-display text-lg text-[#E8E0D0] no-underline"
          >
            {collapsed ? "М" : "Дневник медресе"}
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          className="border-none bg-transparent"
        />
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="!w-full"
          >
            {!collapsed && "Выйти"}
          </Button>
        </div>
      </Sider>

      <Layout className="flex min-h-0 flex-1 flex-col">
        <Header className="flex shrink-0 items-center justify-between gap-4 px-6 !bg-[#161412] !leading-none">
          <Title level={4}>
            {session?.user.name ?? "Дневник медресе"}
          </Title>
          <Text type="secondary">{session?.user.role}</Text>
        </Header>

        <Content className="mx-4 my-4 min-h-0 flex-1 overflow-auto rounded-lg p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
