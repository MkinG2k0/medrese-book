"use client";

import { message } from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  useCreateSession,
  useStudentSession,
} from "@/entities/session/api/use-sessions";
import type { JournalStep } from "@/features/journal/actions/journal-actions";
import {
  INITIAL_VISIBLE_STEPS,
  LOAD_MORE_STEPS_COUNT,
} from "@/features/journal/lib/lesson-constants";
import { buildCumulativeHoursMap } from "@/features/journal/lib/lesson-hours";
import {
  buildSessionDataKey,
  mapSessionStepsOutsideLevel,
} from "@/features/journal/lib/lesson-session-steps";
import { buildInitialStepStates } from "@/features/journal/lib/lesson-step-states";
import type { LessonPageProps } from "@/features/journal/lib/lesson-types";
import { useJournalStore } from "@/features/journal/model/journal-store";
import type { StepGradeState } from "@/features/journal/ui/StepCard";
import { toSessionDate } from "@/shared/lib/calendar-date";
import {
  buildLessonSteps,
  countConsecutiveLoadedNextLevelSteps,
  isProgramComplete as checkProgramComplete,
  isStepPassed,
} from "@/shared/lib/step-completion";

type Attendance = "PRESENT" | "LATE" | "ABSENT";

function resolveInitialUiState(
  effectiveLessonSteps: JournalStep[],
  isProgramComplete: boolean,
  existingSession: ReturnType<typeof useStudentSession>["data"],
) {
  if (existingSession) {
    const gradedStepIds = new Set(
      existingSession.completions.map((c) => c.stepId),
    );
    const maxGradedIndex = effectiveLessonSteps.reduce(
      (max, step, index) =>
        gradedStepIds.has(step.id) ? Math.max(max, index) : max,
      -1,
    );

    if (maxGradedIndex >= 0 && !isProgramComplete) {
      return {
        visibleCount: Math.min(
          Math.max(INITIAL_VISIBLE_STEPS, maxGradedIndex + 1),
          effectiveLessonSteps.length,
        ),
        expandedIds: new Set([effectiveLessonSteps[maxGradedIndex]!.id]),
      };
    }

    if (isProgramComplete) {
      return {
        visibleCount: effectiveLessonSteps.length,
        expandedIds: new Set(effectiveLessonSteps.map((step) => step.id)),
      };
    }
  }

  return {
    visibleCount: isProgramComplete
      ? effectiveLessonSteps.length
      : Math.min(INITIAL_VISIBLE_STEPS, effectiveLessonSteps.length),
    expandedIds: isProgramComplete
      ? new Set(effectiveLessonSteps.map((step) => step.id))
      : effectiveLessonSteps[0]
        ? new Set([effectiveLessonSteps[0].id])
        : new Set<string>(),
  };
}

export function useLessonPage(props: LessonPageProps) {
  const {
    studentId,
    steps,
    allSteps,
    nextLevelSteps,
    stepCompletions,
    nextStudent,
    totalHours,
  } = props;

  const router = useRouter();
  const { dateFilter } = useJournalStore();

  const { data: existingSession, isLoading: isSessionLoading } =
    useStudentSession(studentId, dateFilter);
  const createSession = useCreateSession();

  const isProgramComplete = useMemo(
    () => checkProgramComplete(allSteps, stepCompletions),
    [allSteps, stepCompletions],
  );
  const hasNoSteps = allSteps.length === 0;

  const sessionStepsOutsideLevel = useMemo(
    () => mapSessionStepsOutsideLevel(allSteps, existingSession),
    [allSteps, existingSession],
  );

  const sessionDataKey = buildSessionDataKey(
    studentId,
    dateFilter,
    existingSession,
  );

  const sessionNextLevelLoadedCount = useMemo(() => {
    const sessionStepIds = new Set(
      existingSession?.completions.map((completion) => completion.stepId) ??
        [],
    );
    return countConsecutiveLoadedNextLevelSteps(nextLevelSteps, sessionStepIds);
  }, [existingSession, nextLevelSteps]);

  const [nextLevelUserExtraBySessionKey, setNextLevelUserExtraBySessionKey] =
    useState<Record<string, number>>({});

  const nextLevelUserExtraCount =
    nextLevelUserExtraBySessionKey[sessionDataKey] ?? 0;
  const nextLevelLoadedCount =
    sessionNextLevelLoadedCount + nextLevelUserExtraCount;
  const loadedNextLevelSteps = useMemo(
    () => nextLevelSteps.slice(0, nextLevelLoadedCount),
    [nextLevelLoadedCount, nextLevelSteps],
  );

  const lessonSteps = useMemo(() => {
    if (isProgramComplete) return allSteps;

    return buildLessonSteps(
      allSteps,
      steps,
      existingSession?.completions ?? [],
      sessionStepsOutsideLevel,
      loadedNextLevelSteps,
    );
  }, [
    allSteps,
    steps,
    existingSession,
    isProgramComplete,
    loadedNextLevelSteps,
    sessionStepsOutsideLevel,
  ]);

  const [attendance, setAttendance] = useState<Attendance>("PRESENT");
  const [lateMinutes, setLateMinutes] = useState(5);
  const [visibleCount, setVisibleCount] = useState(
    isProgramComplete
      ? lessonSteps.length
      : Math.min(INITIAL_VISIBLE_STEPS, lessonSteps.length),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    lessonSteps[0] ? new Set([lessonSteps[0].id]) : new Set(),
  );
  const [stepStates, setStepStates] = useState<Record<string, StepGradeState>>(
    () =>
      buildInitialStepStates(
        lessonSteps,
        undefined,
        isProgramComplete ? stepCompletions : undefined,
      ),
  );
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);

  const isSessionReady = !isSessionLoading && loadedSessionKey === sessionDataKey;

  const resolvedStepStates = useMemo(() => {
    const baseline = buildInitialStepStates(
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

  if (!isSessionLoading && loadedSessionKey !== sessionDataKey) {
    const effectiveLessonSteps = isProgramComplete
      ? allSteps
      : buildLessonSteps(
          allSteps,
          steps,
          existingSession?.completions ?? [],
          sessionStepsOutsideLevel,
          nextLevelSteps.slice(0, sessionNextLevelLoadedCount),
        );

    if (existingSession) {
      setAttendance(existingSession.attendance);
      setLateMinutes(existingSession.lateMinutes ?? 5);
      setStepStates(
        buildInitialStepStates(
          effectiveLessonSteps,
          existingSession.completions,
          isProgramComplete ? stepCompletions : undefined,
        ),
      );
    } else {
      setAttendance("PRESENT");
      setLateMinutes(5);
      setStepStates(
        buildInitialStepStates(
          effectiveLessonSteps,
          undefined,
          isProgramComplete ? stepCompletions : undefined,
        ),
      );
    }

    const { visibleCount: nextVisibleCount, expandedIds: nextExpandedIds } =
      resolveInitialUiState(
        effectiveLessonSteps,
        isProgramComplete,
        existingSession,
      );
    setVisibleCount(nextVisibleCount);
    setExpandedIds(nextExpandedIds);
    setLoadedSessionKey(sessionDataKey);
  }

  const visibleSteps = lessonSteps.slice(0, visibleCount);
  const hasMore = visibleCount < lessonSteps.length;
  const allVisibleStepsPassed =
    visibleSteps.length > 0 &&
    visibleSteps.every((step) =>
      isStepPassed(resolvedStepStates[step.id]?.grade),
    );
  const canLoadNextLevel =
    !isProgramComplete &&
    !hasMore &&
    allVisibleStepsPassed &&
    nextLevelLoadedCount < nextLevelSteps.length;

  const cumulativeHoursByAllSteps = useMemo(
    () => ({
      ...buildCumulativeHoursMap(allSteps),
      ...buildCumulativeHoursMap(loadedNextLevelSteps, totalHours),
    }),
    [allSteps, loadedNextLevelSteps, totalHours],
  );

  const getStepTotalHours = (step: JournalStep) =>
    cumulativeHoursByAllSteps[step.id] ?? totalHours;

  const handleAttendanceChange = (
    value: Attendance,
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

  const loadMoreSteps = () => {
    setVisibleCount((count) =>
      Math.min(count + LOAD_MORE_STEPS_COUNT, lessonSteps.length),
    );
  };

  const loadNextLevelSteps = () => {
    const nextCount = Math.min(
      nextLevelLoadedCount + LOAD_MORE_STEPS_COUNT,
      nextLevelSteps.length,
    );
    const newlyLoaded = nextLevelSteps.slice(nextLevelLoadedCount, nextCount);
    setNextLevelUserExtraBySessionKey((prev) => ({
      ...prev,
      [sessionDataKey]: nextCount - sessionNextLevelLoadedCount,
    }));
    setVisibleCount((count) => count + newlyLoaded.length);
    if (newlyLoaded[0]) {
      setExpandedIds(new Set([newlyLoaded[0].id]));
    }
  };

  const saveSession = async () => {
    const completions =
      attendance === "ABSENT"
        ? []
        : visibleSteps
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

  const todayLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return {
    ...props,
    todayLabel,
    isProgramComplete,
    hasNoSteps,
    attendance,
    lateMinutes,
    visibleSteps,
    lessonSteps,
    expandedIds,
    resolvedStepStates,
    hasMore,
    canLoadNextLevel,
    cumulativeHoursByAllSteps,
    isSessionReady,
    isSaving: createSession.isPending,
    getStepTotalHours,
    handleAttendanceChange,
    toggleExpand,
    updateStepState,
    loadMoreSteps,
    loadNextLevelSteps,
    handleSave,
    handleSaveAndNext,
  };
}

export type UseLessonPageResult = ReturnType<typeof useLessonPage>;
