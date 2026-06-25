"use client";

import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Layout, Menu } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { SwitchableUser } from "@/features/auth/actions/switch-user-actions";
import { getDisplayRoleLabel } from "@/features/auth/lib/role-labels";
import type { SubstitutionHeaderLine } from "@/features/auth/lib/get-substitution-header-info";
import { signOutWithLessonCleanup } from "@/features/auth/lib/sign-out";
import { IdleSessionGuard } from "@/features/auth/ui/IdleSessionGuard";
import { SubstitutionHeaderInfo } from "@/features/auth/ui/SubstitutionHeaderInfo";
import { UserSwitcher } from "@/features/auth/ui/UserSwitcher";
import { NotificationBell } from "@/features/notifications";
import { PwaInstallBanner } from "@/features/pwa";
import type { UserRole } from "@/entities/user";
import { useIsMobile } from "@/shared/lib/use-breakpoint";
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
  substitutionHeaderLines: SubstitutionHeaderLine[];
};

type NavPanelProps = {
  collapsed: boolean;
  menuItems: { key: string; icon: React.ReactNode; label: string }[];
  selectedKey: string | undefined;
  onNavigate: (key: string) => void;
  onClose?: () => void;
  switchableUsers: SwitchableUser[];
  session: AppShellProps["session"];
  substituteOwnerUserId: string;
  onSignOut: () => void;
};

function NavPanel({
  collapsed,
  menuItems,
  selectedKey,
  onNavigate,
  onClose,
  switchableUsers,
  session,
  substituteOwnerUserId,
  onSignOut,
}: NavPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 no-underline"
          onClick={onClose}
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
        onClick={({ key }) => onNavigate(key)}
        className="flex-1 overflow-y-auto border-none bg-transparent"
      />
      <div className="shrink-0 px-4 pb-4 pt-2">
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
            onClick={onSignOut}
            className={collapsed ? "" : "shrink-0"}
          >
            {!collapsed && "Выйти"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  session,
  switchableUsers,
  substitutionHeaderLines,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const handleNavigate = (key: string) => {
    router.push(key);
    setDrawerOpen(false);
  };

  const handleSignOut = () => {
    void signOutWithLessonCleanup({
      callbackUrl: "/login",
      role: session.user.role,
      userId: session.user.id,
    });
  };

  const closeDrawer = () => setDrawerOpen(false);

  const navPanel = (
    <NavPanel
      collapsed={isMobile ? false : collapsed}
      menuItems={menuItems}
      selectedKey={selectedKey}
      onNavigate={handleNavigate}
      onClose={isMobile ? closeDrawer : undefined}
      switchableUsers={switchableUsers}
      session={session}
      substituteOwnerUserId={substituteOwnerUserId}
      onSignOut={handleSignOut}
    />
  );

  return (
    <>
      <IdleSessionGuard role={session.user.role} userId={session.user.id} />
      <Layout
        className="h-screen min-h-screen"
        style={{ minHeight: "100vh", height: "100vh" }}
      >
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            width={240}
            className="!h-full !bg-[#12100e]"
          >
            {navPanel}
          </Sider>
        )}

        {isMobile && (
          <Drawer
            title={null}
            placement="left"
            closable={false}
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            size={280}
            styles={{
              body: { padding: 0, background: "#12100e" },
              header: { display: "none" },
            }}
          >
            {navPanel}
          </Drawer>
        )}

        <Layout className="flex min-h-0 flex-1 flex-col">
          <Header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 !bg-[#161412] !leading-none md:gap-4 md:px-6">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label="Открыть меню"
                onClick={() => setDrawerOpen(true)}
                className="shrink-0"
              />
            )}
            <SubstitutionHeaderInfo lines={substitutionHeaderLines} />
            <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
              <NotificationBell />
              <div className="max-w-[45vw] text-right sm:max-w-none">
                <Text className="block truncate">{session.user.name}</Text>
                <Text type="secondary" className="hidden truncate sm:block">
                  {getDisplayRoleLabel(session.user.role, { isSubstituting })}
                </Text>
                <div className="sm:hidden">
                  <SubstitutionHeaderInfo
                    lines={substitutionHeaderLines}
                    variant="inline"
                  />
                </div>
              </div>
            </div>
          </Header>

          <PwaInstallBanner />

          <Content className="mx-1 my-2 flex min-h-0 flex-1 flex-col overflow-auto rounded-lg p-3 md:mx-4 md:my-4 md:p-6">
            {children}
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
