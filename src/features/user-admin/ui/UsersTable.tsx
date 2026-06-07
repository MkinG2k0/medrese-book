"use client";

import { Button, Modal, Table, Tag, Typography } from "antd";
import { useState, useTransition } from "react";

import { resetUserCode } from "@/features/user-admin/actions/user-actions";
import { CreateUserForm } from "@/features/user-admin/ui/CreateUserForm";
import Title from "@/shared/ui/Title";

type UserRow = {
  id: string;
  name: string;
  code: string;
  role: string;
  groupName?: string;
};

type CreatedUser = {
  name: string;
  code: string;
};

type UsersTableProps = {
  users: UserRow[];
  groups: { id: string; name: string }[];
  canResetCode: boolean;
};

export function UsersTable({ users, groups, canResetCode }: UsersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [codeModal, setCodeModal] = useState<CreatedUser[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleReset = (userId: string) => {
    startTransition(async () => {
      const user = users.find((u) => u.id === userId);
      const result = await resetUserCode(userId);
      setCodeModal([{ name: user?.name ?? "Пользователь", code: result.code }]);
    });
  };

  const columns = [
    { title: "Имя", dataIndex: "name", key: "name" },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: "Код",
      dataIndex: "code",
      key: "code",
      render: (code: string) => `••••${code.slice(-2)}`,
    },
    { title: "Группа", dataIndex: "groupName", key: "groupName" },
    ...(canResetCode
      ? [
          {
            title: "Действия",
            key: "actions",
            render: (_: unknown, record: UserRow) => (
              <Button
                size="small"
                onClick={() => handleReset(record.id)}
                loading={isPending}
              >
                Сбросить код
              </Button>
            ),
          },
        ]
      : []),
  ];

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
