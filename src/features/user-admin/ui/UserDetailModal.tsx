"use client";

import { Button, Descriptions, Modal, Tag } from "antd";

import { formatDate, formatPhone } from "@/shared/lib/utils";
import Title from "@/shared/ui/Title";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Админ",
  MANAGER: "Менеджер",
  TEACHER: "Учитель",
  STUDENT: "Ученик",
};

export type UserDetail = {
  id: string;
  name: string;
  code: string;
  role: string;
  phone?: string;
  createdAt: string;
  groupName?: string;
  teacherGroupNames?: string[];
  student?: {
    fullName?: string;
    phone?: string;
    guardianPhone?: string;
    currentStepIdx: number;
    levelTitle?: string;
  };
};

type UserDetailModalProps = {
  user: UserDetail | null;
  onClose: () => void;
  canResetCode: boolean;
  onResetCode?: (userId: string) => void;
  isResetting?: boolean;
};

export function UserDetailModal({
  user,
  onClose,
  canResetCode,
  onResetCode,
  isResetting,
}: UserDetailModalProps) {
  const phone = user?.student?.phone ?? user?.phone;

  return (
    <Modal
      title={user?.name}
      open={!!user}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          {canResetCode && onResetCode && user && (
            <Button onClick={() => onResetCode(user.id)} loading={isResetting}>
              Сбросить код
            </Button>
          )}
          <Button type="primary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      }
    >
      {user && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Роль">
            <Tag>{ROLE_LABELS[user.role] ?? user.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Код">
            <Title level={4} className="tracking-[0.5em]">
              {user.code}
            </Title>
          </Descriptions.Item>
          {user.student?.fullName && user.student.fullName !== user.name && (
            <Descriptions.Item label="Полное имя">
              {user.student.fullName}
            </Descriptions.Item>
          )}
          {phone && (
            <Descriptions.Item label="Телефон">
              {formatPhone(phone)}
            </Descriptions.Item>
          )}
          {user.student?.guardianPhone && (
            <Descriptions.Item label="Телефон опекуна">
              {formatPhone(user.student.guardianPhone)}
            </Descriptions.Item>
          )}
          {user.groupName && (
            <Descriptions.Item label="Группа">{user.groupName}</Descriptions.Item>
          )}
          {user.student?.levelTitle && (
            <Descriptions.Item label="Уровень">
              {user.student.levelTitle}
            </Descriptions.Item>
          )}
          {user.student && (
            <Descriptions.Item label="Текущий шаг">
              Шаг {user.student.currentStepIdx + 1}
            </Descriptions.Item>
          )}
          {user.teacherGroupNames && user.teacherGroupNames.length > 0 && (
            <Descriptions.Item label="Группы">
              {user.teacherGroupNames.join(", ")}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Создан">
            {formatDate(user.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
