"use client";

import { SearchOutlined } from "@ant-design/icons";
import { App, Button, Input, Modal, Table, Tag, Typography } from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { unenrollStudent } from "@/features/groups/actions/group-actions";
import { EnrollStudentModal } from "@/features/groups/ui/EnrollStudentModal";
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
  headerControls?: ReactNode;
  users: UserDetail[];
  groups: { id: string; name: string }[];
  levels: LevelOption[];
  groupId?: string;
  subjectId?: string;
  canManageEnrollment?: boolean;
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
  headerControls,
  users,
  groups,
  levels,
  groupId,
  subjectId,
  canManageEnrollment = false,
  canResetCode = false,
  readOnly = false,
  canEditStatus = false,
}: GroupStudentsTableProps) {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
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

  const handleUnenroll = useCallback(
    (studentId: string, studentName: string) => {
      if (!groupId) return;

      modal.confirm({
        title: "Снять ученика с группы?",
        content: `Ученик «${studentName}» будет снят с группы.`,
        okText: "Снять",
        okType: "danger",
        cancelText: "Отмена",
        onOk: async () => {
          try {
            await unenrollStudent(groupId, { studentId });
            message.success("Ученик снят с группы");
            router.refresh();
          } catch (err) {
            message.error(
              err instanceof Error
                ? err.message
                : "Не удалось снять ученика с группы",
            );
          }
        },
      });
    },
    [groupId, message, modal, router],
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
      ...(canManageEnrollment && groupId
        ? [
            {
              title: "Действия",
              key: "actions",
              render: (_: unknown, record: UserDetail) => {
                const studentId = record.student?.id;
                if (!studentId) return null;
                return (
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUnenroll(studentId, record.name);
                    }}
                  >
                    Снять с группы
                  </Button>
                );
              },
            } satisfies ColumnsType<UserDetail>[number],
          ]
        : []),
    ],
    [canManageEnrollment, groupId, handleUnenroll],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Title level={3}>{title}</Title>
          {subtitle && !headerControls && (
            <Text type="secondary">{subtitle}</Text>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerControls}
          {canManageEnrollment && groupId && subjectId && (
            <Button type="primary" onClick={() => setEnrollOpen(true)}>
              Добавить учеников
            </Button>
          )}
        </div>
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
        groupId={groupId}
        onClose={() => setSelectedUser(null)}
        canResetCode={canResetCode}
        readOnly={readOnly}
        canEditStatus={canEditStatus}
        onResetCode={canResetCode ? handleReset : undefined}
        isResetting={isPending}
      />

      {canManageEnrollment && groupId && subjectId && (
        <EnrollStudentModal
          groupId={groupId}
          subjectId={subjectId}
          levels={levels}
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
        />
      )}

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
