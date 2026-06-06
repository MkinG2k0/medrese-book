"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Avatar, Button, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

import {
  useCreateSession,
  useStudentSession,
} from "@/entities/session/api/use-sessions";
import type { JournalStep } from "@/features/journal/actions/journal-actions";
import type { StepContent } from "@/shared/lib/validations/step";
import { useJournalStore } from "@/features/journal/model/journal-store";
import { AttendanceButtons } from "@/features/journal/ui/AttendanceButtons";
import {
  EMPTY_STEP_GRADE_STATE,
  StepCard,
  type StepGradeState,
} from "@/features/journal/ui/StepCard";
import { toSessionDate } from "@/shared/lib/calendar-date";
import { buildLessonSteps } from "@/shared/lib/step-completion";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const INITIAL_VISIBLE = 3;
const LOAD_MORE_COUNT = 3;

type StepCompletionRecord = {
  stepId: string;
  grade: number;
  note: string | null;
};

type LessonPageProps = {
  studentId: string;
  studentName: string;
  currentStepIdx: number;
  levelNumber: number;
  totalSteps: number;
  totalProgramSteps: number;
  totalHours: number;
  steps: JournalStep[];
  allSteps: JournalStep[];
  stepCompletions: StepCompletionRecord[];
  nextStudent: { id: string; name: string } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildInitialStates(
  steps: JournalStep[],
  sessionCompletions?: StepCompletionRecord[],
  historicalCompletions?: StepCompletionRecord[],
): Record<string, StepGradeState> {
  const sessionByStep = new Map(
    sessionCompletions?.map((c) => [c.stepId, c]) ?? [],
  );
  const historicalByStep = new Map(
    historicalCompletions?.map((c) => [c.stepId, c]) ?? [],
  );

  return Object.fromEntries(
    steps.map((step) => {
      const source =
        sessionByStep.get(step.id) ?? historicalByStep.get(step.id);
      return [
        step.id,
        {
          grade: source?.grade ?? null,
          note: source?.note ?? "",
        },
      ];
    }),
  );
}

function LevelProgramDivider({
  levelNumber,
  levelTitle,
}: {
  levelNumber: number;
  levelTitle: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-[#2a2622]" />
      <Text type="secondary" className="shrink-0 uppercase">
        Уровень {levelNumber} · {levelTitle}
      </Text>
      <div className="h-px flex-1 bg-[#2a2622]" />
    </div>
  );
}

function buildCumulativeHoursMap(
  steps: { id: string; hours: number }[],
  initialHours = 0,
) {
  const result: Record<string, number> = {};
  let running = initialHours;
  for (const step of steps) {
    running += step.hours;
    result[step.id] = running;
  }
  return result;
}

export function LessonPage({
  studentId,
  studentName,
  currentStepIdx,
  levelNumber,
  totalSteps,
  totalProgramSteps,
  totalHours,
  steps,
  allSteps,
  stepCompletions,
  nextStudent,
}: LessonPageProps) {
  const router = useRouter();
  const { dateFilter } = useJournalStore();

  const { data: existingSession, isLoading: isSessionLoading } =
    useStudentSession(studentId, dateFilter);

  const isProgramComplete = useMemo(() => {
    const passedStepIds = new Set(
      stepCompletions.filter((c) => c.grade >= 3).map((c) => c.stepId),
    );
    return allSteps.every((step) => passedStepIds.has(step.id));
  }, [allSteps, stepCompletions]);

  const sessionStepsOutsideLevel = useMemo((): JournalStep[] => {
    if (!existingSession?.completions) return [];

    const currentLevelStepIds = new Set(allSteps.map((step) => step.id));
    return existingSession.completions
      .filter(
        (completion) =>
          completion.step && !currentLevelStepIds.has(completion.stepId),
      )
      .map((completion) => ({
        id: completion.step!.id,
        order: completion.step!.order,
        title: completion.step!.title,
        content: completion.step!.content as StepContent,
        hours: completion.step!.hours,
        levelNumber: completion.step!.level.number,
        levelTitle: completion.step!.level.title,
      }));
  }, [allSteps, existingSession]);

  const lessonSteps = useMemo(() => {
    if (isProgramComplete) return allSteps;

    return buildLessonSteps(
      allSteps,
      steps,
      existingSession?.completions ?? [],
      sessionStepsOutsideLevel,
    );
  }, [
    allSteps,
    steps,
    existingSession,
    isProgramComplete,
    sessionStepsOutsideLevel,
  ]);
  const [attendance, setAttendance] = useState<"PRESENT" | "LATE" | "ABSENT">(
    "PRESENT",
  );
  const [lateMinutes, setLateMinutes] = useState(5);
  const [visibleCount, setVisibleCount] = useState(
    isProgramComplete
      ? lessonSteps.length
      : Math.min(INITIAL_VISIBLE, lessonSteps.length),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    lessonSteps[0] ? new Set([lessonSteps[0].id]) : new Set(),
  );
  const [stepStates, setStepStates] = useState<Record<string, StepGradeState>>(
    () =>
      buildInitialStates(
        lessonSteps,
        undefined,
        isProgramComplete ? stepCompletions : undefined,
      ),
  );
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);

  const sessionKey = `${studentId}:${dateFilter}`;
  const sessionDataKey = existingSession
    ? `${sessionKey}:${existingSession.id}:${existingSession.completions.map((c) => c.stepId).join(",")}`
    : `${sessionKey}:none`;

  const resolvedStepStates = useMemo(() => {
    const baseline = buildInitialStates(
      lessonSteps,
      existingSession?.completions,
      isProgramComplete ? stepCompletions : undefined,
    );
    return { ...baseline, ...stepStates };
  }, [
    lessonSteps,
    existingSession,
    isProgramComplete,
    stepCompletions,
    stepStates,
  ]);

  useEffect(() => {
    if (isSessionLoading || loadedSessionKey === sessionDataKey) return;

    if (existingSession) {
      setAttendance(existingSession.attendance);
      setLateMinutes(existingSession.lateMinutes ?? 5);
      setStepStates(
        buildInitialStates(
          lessonSteps,
          existingSession.completions,
          isProgramComplete ? stepCompletions : undefined,
        ),
      );

      const gradedStepIds = new Set(
        existingSession.completions.map((c) => c.stepId),
      );
      const maxGradedIndex = lessonSteps.reduce(
        (max, step, index) =>
          gradedStepIds.has(step.id) ? Math.max(max, index) : max,
        -1,
      );
      if (maxGradedIndex >= 0 && !isProgramComplete) {
        setVisibleCount(
          Math.min(
            Math.max(INITIAL_VISIBLE, maxGradedIndex + 1),
            lessonSteps.length,
          ),
        );
        setExpandedIds(new Set([lessonSteps[maxGradedIndex]!.id]));
      } else if (isProgramComplete) {
        setVisibleCount(lessonSteps.length);
        setExpandedIds(new Set(lessonSteps.map((step) => step.id)));
      }
    } else {
      setAttendance("PRESENT");
      setLateMinutes(5);
      setStepStates(
        buildInitialStates(
          lessonSteps,
          undefined,
          isProgramComplete ? stepCompletions : undefined,
        ),
      );
      setVisibleCount(
        isProgramComplete
          ? lessonSteps.length
          : Math.min(INITIAL_VISIBLE, lessonSteps.length),
      );
      setExpandedIds(
        isProgramComplete
          ? new Set(lessonSteps.map((step) => step.id))
          : lessonSteps[0]
            ? new Set([lessonSteps[0].id])
            : new Set(),
      );
    }

    setLoadedSessionKey(sessionDataKey);
  }, [
    existingSession,
    isProgramComplete,
    isSessionLoading,
    lessonSteps,
    loadedSessionKey,
    sessionDataKey,
    stepCompletions,
  ]);

  const createSession = useCreateSession();
  const todayLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const visibleSteps = lessonSteps.slice(0, visibleCount);
  const hasMore = visibleCount < lessonSteps.length;
  const currentStepNumber = currentStepIdx + 1;

  const cumulativeHoursByAllSteps = useMemo(
    () => buildCumulativeHoursMap(allSteps),
    [allSteps],
  );

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

  const saveSession = async () => {
    const stepsForSave = visibleSteps;
    const completions =
      attendance === "ABSENT"
        ? []
        : stepsForSave
            .filter((step) => resolvedStepStates[step.id]?.grade !== null)
            .map((step) => ({
              stepId: step.id,
              grade: resolvedStepStates[step.id]!.grade!,
              note: resolvedStepStates[step.id]!.note || null,
            }));

    if (attendance !== "ABSENT" && completions.length === 0) {
      message.warning("Поставьте оценку хотя бы одному шагу");
      return false;
    }

    try {
      await createSession.mutateAsync({
        studentId,
        date: toSessionDate(dateFilter).toISOString(),
        attendance,
        lateMinutes: attendance === "LATE" ? lateMinutes : null,
        note: null,
        completions,
      });
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Ошибка сохранения");
      return false;
    }
  };

  const handleSave = async () => {
    const saved = await saveSession();
    if (!saved) return;

    message.success("Урок сохранён");
    router.push("/journal");
  };

  const handleSaveAndNext = async () => {
    const saved = await saveSession();
    if (!saved) return;

    if (nextStudent) {
      message.success(`Переход к ${nextStudent.name}`);
      router.push(`/journal/${nextStudent.id}`);
    } else {
      message.success("Урок сохранён. Это последний ученик в группе");
      router.push("/journal");
    }
  };

  const getStepTotalHours = (step: JournalStep) =>
    cumulativeHoursByAllSteps[step.id] ?? totalHours;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-24">
      <Link href="/journal" className="flex items-center gap-2 no-underline">
        <ArrowLeftOutlined />
        <Text>Все ученики · {todayLabel}</Text>
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size={56}>{getInitials(studentName)}</Avatar>
          <div className="flex flex-col gap-1">
            <Title level={3} className="!mb-0">
              {studentName}
            </Title>
            <Text type="secondary">
              {isProgramComplete ? (
                <>
                  Уровень {levelNumber} · Все {totalSteps} шагов пройдены ·
                  Итого{" "}
                  {cumulativeHoursByAllSteps[
                    allSteps[allSteps.length - 1]?.id ?? ""
                  ] ?? totalHours}{" "}
                  ч
                </>
              ) : (
                <>
                  Уровень {levelNumber} · Шаг {currentStepNumber} из{" "}
                  {totalProgramSteps} · Итого {totalHours} ч
                </>
              )}
            </Text>
          </div>
        </div>
        <Link href={`/journal/${studentId}/history`}>
          <Button type="link">История шагов</Button>
        </Link>
      </div>

      {isProgramComplete && (
        <Text type="secondary">Все шаги программы пройдены</Text>
      )}

      <div className="flex flex-col gap-2">
        <Text type="secondary" className="uppercase">
          Посещаемость
        </Text>
        <AttendanceButtons
          value={attendance}
          lateMinutes={lateMinutes}
          onChange={handleAttendanceChange}
          disabled={isSessionLoading || loadedSessionKey !== sessionDataKey}
        />
      </div>

      {attendance !== "ABSENT" && (
        <div className="flex flex-col gap-3">
          <Text type="secondary" className="uppercase">
            {isProgramComplete ? "Пройдено в этот день" : "Шаги на сегодня"}
          </Text>
          <div className="flex flex-col gap-3">
            {visibleSteps.map((step, index) => {
              const prevStep = visibleSteps[index - 1];
              const showLevelDivider =
                index > 0 && prevStep!.levelNumber !== step.levelNumber;

              return (
                <Fragment key={step.id}>
                  {showLevelDivider && (
                    <LevelProgramDivider
                      levelNumber={step.levelNumber}
                      levelTitle={step.levelTitle}
                    />
                  )}
                  <StepCard
                    step={step}
                    totalHours={getStepTotalHours(step)}
                    expanded={expandedIds.has(step.id)}
                    state={
                      resolvedStepStates[step.id] ?? EMPTY_STEP_GRADE_STATE
                    }
                    onToggleExpand={() => toggleExpand(step.id)}
                    onStateChange={(state) => updateStepState(step.id, state)}
                  />
                </Fragment>
              );
            })}
          </div>
          {hasMore && (
            <Button
              type="link"
              onClick={() =>
                setVisibleCount((c) =>
                  Math.min(c + LOAD_MORE_COUNT, lessonSteps.length),
                )
              }
              className="self-center"
            >
              Загрузить ещё
            </Button>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#2a2622] bg-[#141210] p-4 md:left-[240px]">
        <div className="mx-auto flex w-full max-w-2xl gap-2">
          {nextStudent && (
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSaveAndNext}
              loading={createSession.isPending}
            >
              Сохранить и перейти к {nextStudent.name}
            </Button>
          )}
          <Button
            type={nextStudent ? "default" : "primary"}
            size="large"
            block
            onClick={handleSave}
            loading={createSession.isPending}
          >
            Сохранить урок
          </Button>
        </div>
      </div>
    </div>
  );
}
