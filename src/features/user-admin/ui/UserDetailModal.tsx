"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Descriptions, Form, Input, Modal, Select, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { updateUser } from "@/features/user-admin/actions/user-actions";
import { formatDate } from "@/shared/lib/utils";
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
    guardianPhone?: string;
    currentStepIdx: number;
    levelId: string;
    levelTitle?: string;
    groupId: string;
    localStepIndex: number;
  };
};

type UserDetailModalProps = {
  user: UserDetail | null;
  groups: { id: string; name: string }[];
  levels: LevelOption[];
  onClose: () => void;
  canResetCode: boolean;
  readOnly?: boolean;
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
    guardianPhone: user.student?.guardianPhone ?? "",
    groupId: user.student?.groupId ?? "",
    levelId: user.student?.levelId ?? "",
    localStepIndex: user.student?.localStepIndex ?? 0,
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
  groups,
  levels,
  readOnly = false,
}: {
  control: ReturnType<typeof useForm<UpdateStudentUserFormInput>>["control"];
  setValue: ReturnType<typeof useForm<UpdateStudentUserFormInput>>["setValue"];
  groups: { id: string; name: string }[];
  levels: LevelOption[];
  readOnly?: boolean;
}) {
  const levelId = useWatch({ control, name: "levelId" });
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
        name="guardianPhone"
        control={control}
        render={({ field }) => (
          <Form.Item label="Телефон опекуна">
            <Input {...field} placeholder="89676123456" disabled={readOnly} />
          </Form.Item>
        )}
      />

      <Controller
        name="groupId"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="Группа"
            validateStatus={fieldState.error ? "error" : ""}
            help={fieldState.error?.message}
          >
            <Select
              {...field}
              disabled={readOnly}
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
              placeholder="Выберите группу"
            />
          </Form.Item>
        )}
      />

      <Controller
        name="levelId"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="Уровень"
            validateStatus={fieldState.error ? "error" : ""}
            help={fieldState.error?.message}
          >
            <Select
              {...field}
              disabled={readOnly}
              onChange={(value) => {
                field.onChange(value);
                setValue("localStepIndex", 0);
              }}
              options={levels.map((level) => ({
                value: level.id,
                label: `Уровень ${level.number}: ${level.title}`,
              }))}
            />
          </Form.Item>
        )}
      />

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
  onResetCode,
  isResetting,
}: UserDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isStudent = user?.role === "STUDENT" && !!user.student;

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
        guardianPhone: values.guardianPhone?.trim() || undefined,
        groupId: values.groupId,
        levelId: values.levelId,
        localStepIndex: values.localStepIndex,
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

  return (
    <Modal
      title={user?.name}
      open={!!user}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          {!readOnly && canResetCode && onResetCode && user && (
            <Button onClick={() => onResetCode(user.id)} loading={isResetting}>
              Сбросить код
            </Button>
          )}
          <Button onClick={onClose}>Закрыть</Button>
          {!readOnly && (
            <Button
              type="primary"
              loading={isPending}
              onClick={
                isStudent
                  ? studentForm.handleSubmit(handleStudentSubmit)
                  : staffForm.handleSubmit(handleStaffSubmit)
              }
            >
              Сохранить
            </Button>
          )}
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
                  groups={groups}
                  levels={levels}
                  readOnly={readOnly}
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
