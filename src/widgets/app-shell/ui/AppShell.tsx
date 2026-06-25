"use client";

import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MessageOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { SwitchableUser } from "@/features/auth/actions/switch-user-actions";
import { getDisplayRoleLabel } from "@/features/auth/lib/role-labels";
import { signOutWithLessonCleanup } from "@/features/auth/lib/sign-out";
import { IdleSessionGuard } from "@/features/auth/ui/IdleSessionGuard";
import { UserSwitcher } from "@/features/auth/ui/UserSwitcher";
import { NotificationBell } from "@/features/notifications";
import type { UserRole } from "@/entities/user";
import { AppLogo } from "@/shared/ui/AppLogo";
import Text from "@/shared/ui/Text";

const { Header, Sider, Content } = Layout;

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
    key: "/my-group",
    icon: <TeamOutlined />,
    label: "Моя группа",
    roles: ["TEACHER"],
  },
  {
    key: "/calendar",
    icon: <CalendarOutlined />,
    label: "Календарь",
    roles: ["TEACHER"],
  },
  {
    key: "/messages",
    icon: <MessageOutlined />,
    label: "Сообщения",
    roles: ["TEACHER", "MANAGER", "STUDENT"],
  },
  {
    key: "/groups",
    icon: <TeamOutlined />,
    label: "Группы",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/analytics",
    icon: <BarChartOutlined />,
    label: "Аналитика",
    roles: ["TEACHER", "MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/analytics/teachers",
    icon: <TeamOutlined />,
    label: "Аналитика учителей",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/admin/leave-calendar",
    icon: <CalendarOutlined />,
    label: "Календарь отпусков",
    roles: ["MANAGER", "SUPER_ADMIN"],
  },
  {
    key: "/student/me",
    icon: <UserOutlined />,
    label: "Мой прогресс",
    roles: ["STUDENT"],
  },
  {
    key: "/student/lessons",
    icon: <BookOutlined />,
    label: "Уроки",
    roles: ["STUDENT"],
  },
  {
    key: "/student/history",
    icon: <HistoryOutlined />,
    label: "История занятий",
    roles: ["STUDENT"],
  },
  {
    key: "/student/awards",
    icon: <TrophyOutlined />,
    label: "Награды",
    roles: ["STUDENT"],
  },
  {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: "Пользователи",
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

type AppShellProps = {
  children: React.ReactNode;
  session: {
    user: {
      id: string;
      name: string;
      role: UserRole;
      switchOwnerId?: string | null;
    };
  };
  switchableUsers: SwitchableUser[];
};

export function AppShell({
  children,
  session,
  switchableUsers,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo(() => {
    const role = session.user.role;
    if (!role) return [];
    return allMenuItems
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }));
  }, [session.user.role]);

  const selectedKey =
    menuItems
      .filter(
        (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
      )
      .sort((a, b) => b.key.length - a.key.length)[0]?.key ?? menuItems[0]?.key;

  const isSubstituting =
    session.user.role === "TEACHER" && !!session.user.switchOwnerId;
  const substituteOwnerUserId =
    session.user.switchOwnerId ?? session.user.id;

  return (
    <>
      <IdleSessionGuard role={session.user.role} userId={session.user.id} />
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
            className="flex items-center gap-2 no-underline"
          >
            <AppLogo size={collapsed ? 36 : 32} />
            {!collapsed && (
              <span className="font-display text-lg text-[#E8E0D0]">
                Дневник медресе
              </span>
            )}
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
          <div className="flex flex-col gap-2">
            {switchableUsers.length > 0 && (
              <UserSwitcher
                users={switchableUsers}
                currentUserId={session.user.id}
                currentUserName={session.user.name}
                substituteOwnerUserId={substituteOwnerUserId}
                collapsed={collapsed}
              />
            )}
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() =>
                void signOutWithLessonCleanup({
                  callbackUrl: "/login",
                  role: session.user.role,
                  userId: session.user.id,
                })
              }
              className={collapsed ? "" : "shrink-0"}
            >
              {!collapsed && "Выйти"}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout className="flex min-h-0 flex-1 flex-col">
        <Header className="flex shrink-0 items-center justify-end gap-4 px-6 !bg-[#161412] !leading-none">
          <NotificationBell />
          <div className="text-right">
            <Text className="block">{session.user.name}</Text>
            <Text type="secondary" className="block">
              {getDisplayRoleLabel(session.user.role, { isSubstituting })}
            </Text>
          </div>
        </Header>

        <Content className="mx-4 my-4 flex min-h-0 flex-1 flex-col overflow-auto rounded-lg p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
    </>
  );
}
