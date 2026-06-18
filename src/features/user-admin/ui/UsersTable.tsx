"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Table, Tag, Typography } from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useRef, useState, useTransition } from "react";

import { resetUserCode } from "@/features/user-admin/actions/user-actions";
import { CreateUserForm } from "@/features/user-admin/ui/CreateUserForm";
import {
  UserDetailModal,
  type UserDetail,
} from "@/features/user-admin/ui/UserDetailModal";
import Title from "@/shared/ui/Title";

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Ученик" },
  { value: "TEACHER", label: "Учитель" },
  { value: "MANAGER", label: "Менеджер" },
  { value: "SUPER_ADMIN", label: "Админ" },
];

const ROLE_LABELS = Object.fromEntries(
  ROLE_OPTIONS.map((option) => [option.value, option.label]),
);

type CreatedUser = {
  name: string;
  code: string;
};

type UsersTableProps = {
  users: UserDetail[];
  groups: { id: string; name: string }[];
  levels: {
    id: string;
    number: number;
    title: string;
    steps: { id: string; order: number; title: string }[];
  }[];
  canResetCode: boolean;
};

function matchesGroupFilter(record: UserDetail, groupName: string) {
  return (
    record.groupName === groupName ||
    (record.teacherGroupNames?.includes(groupName) ?? false)
  );
}

export function UsersTable({ users, groups, levels, canResetCode }: UsersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [codeModal, setCodeModal] = useState<CreatedUser[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const nameSearchInput = useRef<InputRef>(null);

  const groupFilters = useMemo(
    () =>
      [...groups]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => ({ text: group.name, value: group.name })),
    [groups],
  );

  const handleReset = (userId: string) => {
    startTransition(async () => {
      const user = users.find((u) => u.id === userId);
      const result = await resetUserCode(userId);
      setSelectedUser(null);
      setCodeModal([{ name: user?.name ?? "Пользователь", code: result.code }]);
    });
  };

  const columns: ColumnsType<UserDetail> = useMemo(
    () => [
      {
        title: "Имя",
        dataIndex: "name",
        key: "name",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
          <div className="flex flex-col gap-3 p-2" onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={nameSearchInput}
              placeholder="Поиск по имени"
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              className="block"
            />
            <div className="flex gap-2">
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
              >
                Найти
              </Button>
              <Button
                onClick={() => {
                  clearFilters?.();
                  confirm();
                }}
                size="small"
              >
                Сбросить
              </Button>
              <Button type="link" size="small" onClick={() => close()}>
                Закрыть
              </Button>
            </div>
          </div>
        ),
        filterIcon: () => <SearchOutlined />,
        onFilter: (value, record) => {
          const query = String(value).toLowerCase();
          return (
            record.name.toLowerCase().includes(query) ||
            (record.student?.fullName?.toLowerCase().includes(query) ?? false)
          );
        },
        filterDropdownProps: {
          onOpenChange(open) {
            if (open) {
              setTimeout(() => nameSearchInput.current?.select(), 100);
            }
          },
        },
      },
      {
        title: "Роль",
        dataIndex: "role",
        key: "role",
        filters: ROLE_OPTIONS.map((option) => ({
          text: option.label,
          value: option.value,
        })),
        filterSearch: true,
        onFilter: (value, record) => record.role === value,
        render: (role: string) => <Tag>{ROLE_LABELS[role] ?? role}</Tag>,
      },
      {
        title: "Код",
        dataIndex: "code",
        key: "code",
        render: (code: string) => `••••${code.slice(-2)}`,
      },
      {
        title: "Группа",
        dataIndex: "groupName",
        key: "groupName",
        filters: groupFilters,
        filterSearch: true,
        onFilter: (value, record) => matchesGroupFilter(record, String(value)),
        render: (groupName: string | undefined, record) =>
          groupName ?? record.teacherGroupNames?.join(", ") ?? "—",
      },
      ...(canResetCode
        ? [
            {
              title: "Действия",
              key: "actions",
              render: (_: unknown, record: UserDetail) => (
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset(record.id);
                  }}
                  loading={isPending}
                >
                  Сбросить код
                </Button>
              ),
            },
          ]
        : []),
    ],
    [canResetCode, groupFilters, isPending],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Пользователи</Title>
        <Button type="primary" onClick={() => setShowCreate(true)}>
          Создать пользователя
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({
          onClick: () => setSelectedUser(record),
          className: "cursor-pointer",
        })}
      />

      <UserDetailModal
        user={selectedUser}
        groups={groups}
        levels={levels}
        onClose={() => setSelectedUser(null)}
        canResetCode={canResetCode}
        onResetCode={handleReset}
        isResetting={isPending}
      />

      <Modal
        title="Создать пользователя"
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        footer={null}
        destroyOnHidden
      >
        <CreateUserForm
          groups={groups}
          levels={levels}
          onSuccess={(createdUsers) => {
            setShowCreate(false);
            setCodeModal(createdUsers);
          }}
        />
      </Modal>

      <Modal
        title={codeModal && codeModal.length > 1 ? "Коды доступа" : "Код доступа"}
        open={!!codeModal}
        onCancel={() => setCodeModal(null)}
        footer={
          <Button type="primary" onClick={() => setCodeModal(null)}>
            Понятно
          </Button>
        }
      >
        <Typography.Paragraph>
          Сохраните коды — они показываются один раз:
        </Typography.Paragraph>
        <div className="flex flex-col gap-4">
          {codeModal?.map((user) => (
            <div key={user.name} className="flex flex-col gap-1">
              <Typography.Text strong>{user.name}</Typography.Text>
              <Title level={3} className="!text-center tracking-[0.5em]">
                {user.code}
              </Title>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
