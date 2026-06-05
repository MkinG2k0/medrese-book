"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Avatar, Button, Flex, message } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useCreateSession } from "@/entities/session/api/use-sessions";
import type { JournalStep } from "@/features/journal/actions/journal-actions";
import { AttendanceButtons } from "@/features/journal/ui/AttendanceButtons";
import { StepCard, type StepGradeState } from "@/features/journal/ui/StepCard";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const INITIAL_VISIBLE = 3;
const LOAD_MORE_COUNT = 3;

type LessonPageProps = {
  studentId: string;
  studentName: string;
  currentStepIdx: number;
  levelNumber: number;
  totalSteps: number;
  totalHours: number;
  steps: JournalStep[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildInitialStates(steps: JournalStep[]): Record<string, StepGradeState> {
  return Object.fromEntries(
    steps.map((step, index) => [
      step.id,
      { selected: index === 0, grade: null, note: "" },
    ]),
  );
}

export function LessonPage({
  studentId,
  studentName,
  currentStepIdx,
  levelNumber,
  totalSteps,
  totalHours,
  steps,
}: LessonPageProps) {
  const [attendance, setAttendance] = useState<"PRESENT" | "LATE" | "ABSENT">(
    "PRESENT",
  );
  const [lateMinutes, setLateMinutes] = useState(5);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_VISIBLE, steps.length),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    steps[0] ? new Set([steps[0].id]) : new Set(),
  );
  const [stepStates, setStepStates] = useState<Record<string, StepGradeState>>(
    () => buildInitialStates(steps),
  );

  const createSession = useCreateSession();
  const todayLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const visibleSteps = steps.slice(0, visibleCount);
  const hasMore = visibleCount < steps.length;
  const currentStepNumber = currentStepIdx + 1;

  const cumulativeHoursByStep = useMemo(() => {
    let running = totalHours;
    return Object.fromEntries(
      steps.map((step) => {
        running += step.hours;
        return [step.id, running];
      }),
    );
  }, [steps, totalHours]);

  const handleAttendanceChange = (
    value: "PRESENT" | "LATE" | "ABSENT",
    minutes?: number,
  ) => {
    setAttendance(value);
    if (minutes !== undefined) setLateMinutes(minutes);
  };

  const toggleExpand = (stepId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const updateStepState = (stepId: string, state: StepGradeState) => {
    setStepStates((prev) => ({ ...prev, [stepId]: state }));
  };

  const handleSave = async () => {
    const completions =
      attendance === "ABSENT"
        ? []
        : visibleSteps
            .filter(
              (step) =>
                stepStates[step.id]?.selected &&
                stepStates[step.id]?.grade !== null,
            )
            .map((step) => ({
              stepId: step.id,
              grade: stepStates[step.id]!.grade!,
              note: stepStates[step.id]!.note || null,
            }));

    if (attendance !== "ABSENT" && completions.length === 0) {
      message.warning("Выберите хотя бы один шаг и поставьте оценку");
      return;
    }

    try {
      await createSession.mutateAsync({
        studentId,
        date: new Date().toISOString(),
        attendance,
        lateMinutes: attendance === "LATE" ? lateMinutes : null,
        note: null,
        completions,
      });
      message.success("Урок сохранён");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  if (steps.length === 0) {
    return (
      <Flex vertical gap={16}>
        <Link href="/journal" className="flex items-center gap-2 no-underline">
          <ArrowLeftOutlined />
          <Text>Все ученики</Text>
        </Link>
        <Title level={3}>{studentName}</Title>
        <Text type="secondary">Все шаги программы пройдены</Text>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={24} className="mx-auto max-w-2xl pb-24">
      <Link href="/journal" className="flex items-center gap-2 no-underline">
        <ArrowLeftOutlined />
        <Text>
          Все ученики · {todayLabel}
        </Text>
      </Link>

      <Flex align="center" gap={16}>
        <Avatar size={56}>{getInitials(studentName)}</Avatar>
        <Flex vertical gap={4}>
          <Title level={3} className="!mb-0">
            {studentName}
          </Title>
          <Text type="secondary">
            Уровень {levelNumber} · Шаг {currentStepNumber} из {totalSteps} ·
            Итого {totalHours} ч
          </Text>
        </Flex>
      </Flex>

      <Flex vertical gap={8}>
        <Text type="secondary" className="uppercase">
          Посещаемость
        </Text>
        <AttendanceButtons
          value={attendance}
          lateMinutes={lateMinutes}
          onChange={handleAttendanceChange}
        />
      </Flex>

      {attendance !== "ABSENT" && (
        <Flex vertical gap={12}>
          <Text type="secondary" className="uppercase">
            Шаги на сегодня
          </Text>
          <Flex vertical gap={12}>
            {visibleSteps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                totalHours={cumulativeHoursByStep[step.id] ?? totalHours}
                expanded={expandedIds.has(step.id)}
                state={stepStates[step.id]!}
                onToggleExpand={() => toggleExpand(step.id)}
                onStateChange={(state) => updateStepState(step.id, state)}
              />
            ))}
          </Flex>
          {hasMore && (
            <Button
              type="link"
              onClick={() =>
                setVisibleCount((c) =>
                  Math.min(c + LOAD_MORE_COUNT, steps.length),
                )
              }
              className="self-center"
            >
              Загрузить ещё
            </Button>
          )}
        </Flex>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#2a2622] bg-[#141210] p-4 md:left-[240px]">
        <Button
          type="primary"
          size="large"
          block
          onClick={handleSave}
          loading={createSession.isPending}
        >
          Сохранить урок
        </Button>
      </div>
    </Flex>
  );
}
