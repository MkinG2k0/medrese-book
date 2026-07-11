"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Descriptions, Form, Input, Modal, Select, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { updateStudentStatus } from "@/features/student-admin/actions/student-admin-actions";
import { deleteUser, updateUser } from "@/features/user-admin/actions/user-actions";
import { formatDate } from "@/shared/lib/utils";
import {
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_VALUES,
  type StudentStatus,
} from "@/shared/lib/student-status";
import {
  updateStaffUserFormSchema,
  updateStudentUserFormSchema,
  type UpdateStaffUserFormInput,
  type UpdateStudentUserFormInput,
} from "@/shared/lib/validations/user";
import Title from "@/shared/ui/Title";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Админ",
  MANAGER: "Менеджер",
  TEACHER: "Учитель",
  STUDENT: "Ученик",
  ACCOUNTANT: "Бухгалтер",
};

type LevelOption = {
  id: string;
  number: number;
  title: string;
  steps: { id: string; order: number; title: string }[];
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
    id: string;
    fullName?: string;
    phone?: string;
    guardianName?: string;
    guardianPhone?: string;
    currentStepIdx: number;
    levelId: string;
    levelTitle?: string;
    groupId: string;
    localStepIndex: number;
    status: StudentStatus;
    enrollmentGroups?: {
      groupId: string;
      groupName: string;
      levelId: string;
      levelTitle: string;
    }[];
  };
};

type UserDetailModalProps = {
  user: UserDetail | null;
  groups: { id: string; name: string }[];
  levels: LevelOption[];
  onClose: () => void;
  canResetCode: boolean;
  readOnly?: boolean;
  canEditStatus?: boolean;
  onResetCode?: (userId: string) => void;
  isResetting?: boolean;
};

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
  let offset = 0;
  for (const level of levels) {
    if (level.number >= levelNumber) break;
    offset += level.steps.length;
  }
  return offset;
}

function getStudentDefaultValues(user: UserDetail): UpdateStudentUserFormInput {
  return {
    name: user.name,
    phone: user.student?.phone ?? "",
    guardianName: user.student?.guardianName ?? "",
    guardianPhone: user.student?.guardianPhone ?? "",
    localStepIndex: user.student?.localStepIndex ?? 0,
    status: user.student?.status ?? "ACTIVE",
  };
}

function getStaffDefaultValues(user: UserDetail): UpdateStaffUserFormInput {
  return {
    name: user.name,
    phone: user.phone ?? "",
  };
}

const FORM_LAYOUT = {
  layout: "horizontal" as const,
  labelCol: { flex: "0 0 150px" },
  labelAlign: "right" as const,
  wrapperCol: { flex: "1" },
  colon: false,
};

function StudentEditFields({
  control,
  setValue,
  levels,
  enrollmentGroups,
  readOnly = false,
  canEditStatus = false,
}: {
  control: ReturnType<typeof useForm<UpdateStudentUserFormInput>>["control"];
  setValue: ReturnType<typeof useForm<UpdateStudentUserFormInput>>["setValue"];
  levels: LevelOption[];
  enrollmentGroups?: {
    groupId: string;
    groupName: string;
    levelId: string;
    levelTitle: string;
  }[];
  readOnly?: boolean;
  canEditStatus?: boolean;
}) {
  const levelId = enrollmentGroups?.[0]?.levelId;
  const localStepIndex = useWatch({ control, name: "localStepIndex" });
  const selectedLevel = levels.find((level) => level.id === levelId);

  useEffect(() => {
    if (!selectedLevel) return;
    if (localStepIndex > selectedLevel.steps.length) {
      setValue("localStepIndex", selectedLevel.steps.length);
    }
  }, [selectedLevel, localStepIndex, setValue]);

  const stepOptions = useMemo(() => {
    if (!selectedLevel) return [];
    const offset = getStepOffset(levels, selectedLevel.number);
    return selectedLevel.steps.map((step, index) => ({
      value: index,
      label: `Шаг ${offset + index + 1}: ${step.title}`,
    }));
  }, [levels, selectedLevel]);

  return (
    <>
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Form.Item label="Телефон">
            <Input {...field} placeholder="89676123456" disabled={readOnly} />
          </Form.Item>
        )}
      />

      <Controller
        name="guardianName"
        control={control}
        render={({ field }) => (
          <Form.Item label="Имя опекуна">
            <Input
              {...field}
              placeholder="Ибрагимов Камал Ахмедович"
              disabled={readOnly}
            />
          </Form.Item>
        )}
      />

      <Controller
        name="guardianPhone"
        control={control}
        render={({ field }) => (
          <Form.Item label="Телефон опекуна">
            <Input {...field} placeholder="89676123456" disabled={readOnly} />
          </Form.Item>
        )}
      />

      <Form.Item label="Группы">
        <Input
          disabled
          value={
            enrollmentGroups && enrollmentGroups.length > 0
              ? enrollmentGroups
                  .map((enrollment) => `${enrollment.groupName} (${enrollment.levelTitle})`)
                  .join(", ")
              : "—"
          }
        />
      </Form.Item>

      <Form.Item label="Уровень">
        <Input disabled value={enrollmentGroups?.[0]?.levelTitle ?? "—"} />
      </Form.Item>

      <Controller
        name="localStepIndex"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="Текущий шаг"
            validateStatus={fieldState.error ? "error" : ""}
            help={fieldState.error?.message}
          >
            <Select
              {...field}
              options={stepOptions}
              disabled={readOnly || !selectedLevel}
            />
          </Form.Item>
        )}
      />

      {(canEditStatus || !readOnly) && (
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Статус"
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <Select
                {...field}
                disabled={readOnly && !canEditStatus}
                options={STUDENT_STATUS_VALUES.map((value) => ({
                  value,
                  label: STUDENT_STATUS_LABELS[value],
                }))}
              />
            </Form.Item>
          )}
        />
      )}
    </>
  );
}

export function UserDetailModal({
  user,
  groups,
  levels,
  onClose,
  canResetCode,
  readOnly = false,
  canEditStatus = false,
  onResetCode,
  isResetting,
}: UserDetailModalProps) {
  const router = useRouter();
  const { modal, message } = App.useApp();
  const [isPending, startTransition] = useTransition();
  const isStudent = user?.role === "STUDENT" && !!user.student;
  const statusOnlyMode = readOnly && canEditStatus && isStudent;
  const showSaveButton = !readOnly || statusOnlyMode;

  const studentForm = useForm<UpdateStudentUserFormInput>({
    resolver: zodResolver(updateStudentUserFormSchema),
    defaultValues: user ? getStudentDefaultValues(user) : undefined,
  });

  const staffForm = useForm<UpdateStaffUserFormInput>({
    resolver: zodResolver(updateStaffUserFormSchema),
    defaultValues: user ? getStaffDefaultValues(user) : undefined,
  });

  useEffect(() => {
    if (!user) return;
    if (isStudent) {
      studentForm.reset(getStudentDefaultValues(user));
      return;
    }
    staffForm.reset(getStaffDefaultValues(user));
  }, [user, isStudent, studentForm, staffForm]);

  const handleStudentSubmit = (values: UpdateStudentUserFormInput) => {
    if (!user) return;

    startTransition(async () => {
      await updateUser(user.id, {
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        guardianName: values.guardianName?.trim() || undefined,
        guardianPhone: values.guardianPhone?.trim() || undefined,
        localStepIndex: values.localStepIndex,
        status: values.status,
      });
      router.refresh();
      onClose();
    });
  };

  const handleStaffSubmit = (values: UpdateStaffUserFormInput) => {
    if (!user) return;

    startTransition(async () => {
      await updateUser(user.id, {
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
      });
      router.refresh();
      onClose();
    });
  };

  const handleStatusOnlySubmit = () => {
    if (!user?.student) return;

    startTransition(async () => {
      await updateStudentStatus(user.student!.id, {
        status: studentForm.getValues("status"),
      });
      router.refresh();
      onClose();
    });
  };

  const handleSave = () => {
    if (statusOnlyMode) {
      handleStatusOnlySubmit();
      return;
    }

    if (isStudent) {
      studentForm.handleSubmit(handleStudentSubmit)();
      return;
    }

    staffForm.handleSubmit(handleStaffSubmit)();
  };

  const handleDelete = () => {
    if (!user || user.role === "SUPER_ADMIN") return;

    modal.confirm({
      title: "Удалить пользователя?",
      content: `«${user.name}» и все связанные данные будут удалены без возможности восстановления.`,
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              await deleteUser(user.id);
              message.success("Пользователь удалён");
              router.refresh();
              onClose();
              resolve();
            } catch (err) {
              message.error(
                err instanceof Error ? err.message : "Ошибка удаления",
              );
              reject(err);
            }
          });
        }),
    });
  };

  const canDelete = !readOnly && user && user.role !== "SUPER_ADMIN";

  return (
    <Modal
      title={user?.name}
      open={!!user}
      onCancel={onClose}
      footer={
        <div className="flex items-center justify-between gap-2">
          {canDelete ? (
            <Button danger loading={isPending} onClick={handleDelete}>
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {!readOnly && canResetCode && onResetCode && user && (
              <Button onClick={() => onResetCode(user.id)} loading={isResetting}>
                Сбросить код
              </Button>
            )}
            <Button onClick={onClose}>Закрыть</Button>
            {showSaveButton && (
              <Button type="primary" loading={isPending} onClick={handleSave}>
                Сохранить
              </Button>
            )}
          </div>
        </div>
      }
    >
      {user && (
        <div className="flex flex-col gap-4">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Роль">
              <Tag>{ROLE_LABELS[user.role] ?? user.role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Код">
              <Title level={4} className="tracking-[0.5em]">
                {user.code}
              </Title>
            </Descriptions.Item>
            <Descriptions.Item label="Создан">
              {formatDate(user.createdAt)}
            </Descriptions.Item>
            {isStudent && user.student && !canEditStatus && (
              <Descriptions.Item label="Статус">
                <Tag>{STUDENT_STATUS_LABELS[user.student.status]}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>

          {isStudent ? (
            <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)}>
              <Form {...FORM_LAYOUT} component="div">
                <Controller
                  name="name"
                  control={studentForm.control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Имя"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Input {...field} disabled={readOnly} />
                    </Form.Item>
                  )}
                />

                <StudentEditFields
                  control={studentForm.control}
                  setValue={studentForm.setValue}
                  levels={levels}
                  enrollmentGroups={user.student?.enrollmentGroups}
                  readOnly={readOnly}
                  canEditStatus={canEditStatus}
                />
              </Form>
            </form>
          ) : (
            <form onSubmit={staffForm.handleSubmit(handleStaffSubmit)}>
              <Form {...FORM_LAYOUT} component="div">
                <Controller
                  name="name"
                  control={staffForm.control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Имя"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Input {...field} disabled={readOnly} />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="phone"
                  control={staffForm.control}
                  render={({ field }) => (
                    <Form.Item label="Телефон">
                      <Input {...field} placeholder="89676123456" disabled={readOnly} />
                    </Form.Item>
                  )}
                />

                {user.teacherGroupNames && user.teacherGroupNames.length > 0 && (
                  <Form.Item label="Группы">
                    <Input disabled value={user.teacherGroupNames.join(", ")} />
                  </Form.Item>
                )}
              </Form>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
