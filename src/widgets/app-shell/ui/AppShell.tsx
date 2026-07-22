"use client";

import {
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Layout, Menu } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "../lib/sidebar-storage";

const { Header, Sider, Content } = Layout;

type MenuItemDef = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

const menuItemDefs: Record<string, MenuItemDef> = {
  "/journal": {
    key: "/journal",
    icon: <BookOutlined />,
    label: "Журнал",
  },
  "/extra-assignments": {
    key: "/extra-assignments",
    icon: <FileTextOutlined />,
    label: "Доп. задания",
  },
  "/my-group": {
    key: "/my-group",
    icon: <TeamOutlined />,
    label: "Моя группа",
  },
  "/calendar": {
    key: "/calendar",
    icon: <CalendarOutlined />,
    label: "Календарь",
  },
  "/journal/history": {
    key: "/journal/history",
    icon: <HistoryOutlined />,
    label: "История шагов",
  },
  "/analytics": {
    key: "/analytics",
    icon: <BarChartOutlined />,
    label: "Аналитика",
  },
  "/messages": {
    key: "/messages",
    icon: <MessageOutlined />,
    label: "Сообщения",
  },
  "/news": {
    key: "/news",
    icon: <ReadOutlined />,
    label: "Новости",
  },
  "/groups": {
    key: "/groups",
    icon: <TeamOutlined />,
    label: "Группы",
  },
  "/admin/users": {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: "Пользователи",
  },
  "/admin/subjects": {
    key: "/admin/subjects",
    icon: <BookOutlined />,
    label: "Предметы",
  },
  "/analytics/teachers": {
    key: "/analytics/teachers",
    icon: <TeamOutlined />,
    label: "Аналитика учителей",
  },
  "/admin/leave-calendar": {
    key: "/admin/leave-calendar",
    icon: <CalendarOutlined />,
    label: "Календарь отпусков",
  },
  "/admin/awards": {
    key: "/admin/awards",
    icon: <TrophyOutlined />,
    label: "Награды",
  },
  "/admin/audit-log": {
    key: "/admin/audit-log",
    icon: <AuditOutlined />,
    label: "Журнал действий",
  },
  "/accounting": {
    key: "/accounting",
    icon: <DollarOutlined />,
    label: "Бухгалтерия",
  },
  "/accounting/payments": {
    key: "/accounting/payments",
    icon: <DollarOutlined />,
    label: "Платежи",
  },
  "/accounting/salaries": {
    key: "/accounting/salaries",
    icon: <TeamOutlined />,
    label: "Зарплаты",
  },
  "/accounting/expenses": {
    key: "/accounting/expenses",
    icon: <DollarOutlined />,
    label: "Расходы",
  },
  "/accounting/ledger": {
    key: "/accounting/ledger",
    icon: <HistoryOutlined />,
    label: "Операции",
  },
  "/accounting/my-salary": {
    key: "/accounting/my-salary",
    icon: <DollarOutlined />,
    label: "Моя зарплата",
  },
  "/student/me": {
    key: "/student/me",
    icon: <UserOutlined />,
    label: "Мой прогресс",
  },
  "/student/lessons": {
    key: "/student/lessons",
    icon: <BookOutlined />,
    label: "Уроки",
  },
  "/student/history": {
    key: "/student/history",
    icon: <HistoryOutlined />,
    label: "История занятий",
  },
  "/student/extra-assignments": {
    key: "/student/extra-assignments",
    icon: <FileTextOutlined />,
    label: "Доп. задания",
  },
  "/student/awards": {
    key: "/student/awards",
    icon: <TrophyOutlined />,
    label: "Награды",
  },
  "/help": {
    key: "/help",
    icon: <QuestionCircleOutlined />,
    label: "Справка",
  },
  "/settings": {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Настройки",
  },
};

const managerMenuOrder = [
  "/groups",
  "/admin/users",
  "/admin/subjects",
  "/extra-assignments",
  "/analytics",
  "/analytics/teachers",
  "/admin/leave-calendar",
  "/admin/awards",
  "/admin/audit-log",
  "/news",
  "/messages",
  "/help",
  "/settings",
] as const;

const accountantMenuOrder = [
  "/accounting",
  "/accounting/payments",
  "/accounting/salaries",
  "/accounting/expenses",
  "/accounting/ledger",
] as const;

const MENU_ORDER_BY_ROLE: Record<UserRole, readonly string[]> = {
  TEACHER: [
    "/journal",
    "/extra-assignments",
    "/my-group",
    "/calendar",
    "/journal/history",
    "/accounting/my-salary",
    "/analytics",
    "/news",
    "/messages",
    "/help",
    "/settings",
  ],
  MANAGER: managerMenuOrder,
  SUPER_ADMIN: managerMenuOrder,
  ACCOUNTANT: [...accountantMenuOrder, "/news", "/messages", "/settings"],
  STUDENT: [
    "/student/me",
    "/student/lessons",
    "/student/history",
    "/student/extra-assignments",
    "/student/awards",
    "/news",
    "/messages",
    "/settings",
  ],
};

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
  showSubstitutionRoleLabel: boolean;
  substitutionTargetUserIds: string[];
};

type NavPanelProps = {
  collapsed: boolean;
  menuItems: { key: string; icon: React.ReactNode; label: string }[];
  selectedKey: string | undefined;
  onNavigate: (key: string) => void;
  onClose?: () => void;
  switchableUsers: SwitchableUser[];
  session: AppShellProps["session"];
  substitutionTargetUserIds: string[];
  onSignOut: () => void;
  onToggleCollapse?: (next: boolean) => void;
};

function NavPanel({
  collapsed,
  menuItems,
  selectedKey,
  onNavigate,
  onClose,
  switchableUsers,
  session,
  substitutionTargetUserIds,
  onSignOut,
  onToggleCollapse,
}: NavPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 w-full shrink-0 items-center">
        {onToggleCollapse && (
          <div className="flex w-20 shrink-0 items-center justify-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
              onClick={() => onToggleCollapse(!collapsed)}
              className="!inline-flex !h-10 !w-10 !min-w-10 !items-center !justify-center !p-0"
            />
          </div>
        )}
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
              substitutionTargetUserIds={substitutionTargetUserIds}
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
  showSubstitutionRoleLabel,
  substitutionTargetUserIds,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = readSidebarCollapsed();
    if (stored !== null) {
      setCollapsed(stored);
    }
  }, []);

  const handleCollapse = (next: boolean) => {
    setCollapsed(next);
    writeSidebarCollapsed(next);
  };

  const menuItems = useMemo(() => {
    const role = session.user.role;
    if (!role) return [];
    return MENU_ORDER_BY_ROLE[role]
      .map((key) => menuItemDefs[key])
      .filter((item): item is MenuItemDef => item != null)
      .map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }));
  }, [session.user.role]);

  const selectedKey = menuItems
    .filter(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
    )
    .sort((a, b) => b.key.length - a.key.length)[0]?.key;

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
      substitutionTargetUserIds={substitutionTargetUserIds}
      onSignOut={handleSignOut}
      onToggleCollapse={isMobile ? undefined : handleCollapse}
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
            onCollapse={handleCollapse}
            trigger={null}
            width={240}
            className="!h-full !bg-sidebar"
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
              body: { padding: 0 },
              header: { display: "none" },
            }}
            classNames={{ body: "!bg-sidebar" }}
          >
            {navPanel}
          </Drawer>
        )}

        <Layout className="flex min-h-0 min-w-0 flex-1 flex-col !bg-background">
          <Header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-3 py-2 !bg-card !leading-none md:gap-4 md:px-6">
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
              {session.user.role !== "ACCOUNTANT" && <NotificationBell />}
              <div className="max-w-[45vw] text-right sm:max-w-none">
                <Text className="block truncate">{session.user.name}</Text>
                <Text type="secondary" className="hidden truncate sm:block">
                  {getDisplayRoleLabel(session.user.role, {
                    isSubstituting: showSubstitutionRoleLabel,
                  })}
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col p-1 md:p-4">
            <Content className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-lg p-3 md:p-6">
              {children}
            </Content>
          </div>
        </Layout>
      </Layout>
    </>
  );
}
