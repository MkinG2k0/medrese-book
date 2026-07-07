"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Table, Tag, Typography } from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import { resetUserCode } from "@/features/user-admin/actions/user-actions";
import type { LevelOption } from "@/features/user-admin/lib/map-users-to-details";
import {
  UserDetailModal,
  type UserDetail,
} from "@/features/user-admin/ui/UserDetailModal";
import {
  STUDENT_STATUS_LABELS,
  type StudentStatus,
} from "@/shared/lib/student-status";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type GroupStudentsTableProps = {
  title: string;
  subtitle?: string;
  users: UserDetail[];
  groups: { id: string; name: string }[];
  levels: LevelOption[];
  groupId?: string;
  subjectId?: string;
  canResetCode?: boolean;
  readOnly?: boolean;
  canEditStatus?: boolean;
};

const STATUS_TAG_COLORS: Record<StudentStatus, string> = {
  ACTIVE: "green",
  PAUSE: "gold",
  ARCHIVE: "default",
};

export function GroupStudentsTable({
  title,
  subtitle,
  users,
  groups,
  levels,
  canResetCode = false,
  readOnly = false,
  canEditStatus = false,
}: GroupStudentsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [codeModal, setCodeModal] = useState<{ name: string; code: string } | null>(
    null,
  );
  const nameSearchInput = useRef<InputRef>(null);

  const handleReset = useCallback(
    (userId: string) => {
      startTransition(async () => {
        const user = users.find((item) => item.id === userId);
        const result = await resetUserCode(userId);
        setSelectedUser(null);
        setCodeModal({
          name: user?.name ?? "Пользователь",
          code: result.code,
        });
      });
    },
    [users],
  );

  const columns: ColumnsType<UserDetail> = useMemo(
    () => [
      {
        title: "Имя",
        dataIndex: "name",
        key: "name",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
          close,
        }) => (
          <div
            className="flex flex-col gap-3 p-2"
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              ref={nameSearchInput}
              placeholder="Поиск по имени"
              value={String(selectedKeys[0] ?? "")}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
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
        onFilter: (value, record) =>
          record.name.toLowerCase().includes(String(value).toLowerCase()),
        filterDropdownProps: {
          onOpenChange(open) {
            if (open) {
              setTimeout(() => nameSearchInput.current?.select(), 100);
            }
          },
        },
      },
      {
        title: "Уровень",
        key: "levelTitle",
        render: (_, record) => record.student?.levelTitle ?? "—",
      },
      {
        title: "Статус",
        key: "status",
        render: (_, record) => {
          const status = record.student?.status ?? "ACTIVE";
          return (
            <Tag color={STATUS_TAG_COLORS[status]}>
              {STUDENT_STATUS_LABELS[status]}
            </Tag>
          );
        },
      },
      {
        title: "Текущий шаг",
        key: "currentStepIdx",
        render: (_, record) => (
          <Tag>Шаг {(record.student?.currentStepIdx ?? 0) + 1}</Tag>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>{title}</Title>
      {subtitle && <Text type="secondary">{subtitle}</Text>}

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
        readOnly={readOnly}
        canEditStatus={canEditStatus}
        onResetCode={canResetCode ? handleReset : undefined}
        isResetting={isPending}
      />

      <Modal
        title="Код доступа"
        open={!!codeModal}
        onCancel={() => setCodeModal(null)}
        footer={
          <Button type="primary" onClick={() => setCodeModal(null)}>
            Понятно
          </Button>
        }
      >
        <Typography.Paragraph>
          Сохраните код — он показывается один раз:
        </Typography.Paragraph>
        {codeModal && (
          <div className="flex flex-col gap-1">
            <Typography.Text strong>{codeModal.name}</Typography.Text>
            <Title level={3} className="!text-center tracking-[0.5em]">
              {codeModal.code}
            </Title>
          </div>
        )}
      </Modal>
    </div>
  );
}
