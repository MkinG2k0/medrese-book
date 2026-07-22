"use client";

import { App } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  useCreateSession,
  useStudentSession,
} from "@/entities/session/api/use-sessions";
import {
  useClearExtraAssignmentGrade,
  useGradeExtraAssignment,
  useSessionExtraAssignments,
} from "@/entities/extra-assignment";
import type { SessionExtraAssignmentInstance } from "@/entities/extra-assignment";
import { useTeachingSession } from "@/entities/teaching-session/api/use-teaching-session";
import {
  getNextLevelJournalSteps,
  type JournalStep,
} from "@/features/journal/actions/journal-actions";
import {
  INITIAL_VISIBLE_STEPS,
  LOAD_MORE_STEPS_COUNT,
} from "@/features/journal/lib/lesson-constants";
import { buildCumulativeHoursMap } from "@/features/journal/lib/lesson-hours";
import {
  buildSessionDataKey,
  mapSessionStepsOutsideLevel,
} from "@/features/journal/lib/lesson-session-steps";
import { buildInitialStepStates, buildInitialExtraGradeStates } from "@/features/journal/lib/lesson-step-states";
import { shouldShowOnlyCompletedLessonSteps } from "@/features/journal/lib/lesson-view-mode";
import type { LessonPageProps } from "@/features/journal/lib/lesson-types";
import { useJournalStore, selectExtraAssignmentGrades, selectSessionStepStates } from "@/features/journal/model/journal-store";
import { useJournalDate } from "@/features/journal/model/use-journal-date";
import {
  EMPTY_STEP_GRADE_STATE,
  type StepGradeState,
} from "@/features/journal/ui/StepCard";
import { toSessionDate } from "@/shared/lib/calendar-date";
import {
  buildLessonSteps,
  countConsecutiveLoadedNextLevelSteps,
  isProgramComplete as checkProgramComplete,
  isStepPassed,
  sortStepsByLevel,
} from "@/shared/lib/step-completion";

type Attendance = "PRESENT" | "LATE" | "ABSENT";

const EMPTY_EXTRA_INSTANCES: SessionExtraAssignmentInstance[] = [];

function filterStepsForDayHistory<
  T extends { id: string; order: number; levelNumber?: number },
>(
  stepPool: T[],
  sessionCompletions: { stepId: string }[] | undefined,
  extraInstances: { displayStepId: string }[],
): T[] {
  const stepIds = new Set([
    ...(sessionCompletions?.map((completion) => completion.stepId) ?? []),
    ...extraInstances.map((instance) => instance.displayStepId),
  ]);

  if (stepIds.size === 0) return [];

  return sortStepsByLevel(stepPool.filter((step) => stepIds.has(step.id)));
}

function getMaxStepIndex<T extends { id: string }>(
  steps: T[],
  stepIds: Set<string>,
): number {
  return steps.reduce(
    (max, step, index) => (stepIds.has(step.id) ? Math.max(max, index) : max),
    -1,
  );
}

function applyPendingExtraUiState(
  effectiveLessonSteps: JournalStep[],
  visibleCount: number,
  expandedIds: Set<string>,
  pendingExtraStepIds: Set<string>,
): { visibleCount: number; expandedIds: Set<string> } {
  if (pendingExtraStepIds.size === 0) {
    return { visibleCount, expandedIds };
  }

  const maxPendingIndex = getMaxStepIndex(
    effectiveLessonSteps,
    pendingExtraStepIds,
  );
  const nextVisibleCount =
    maxPendingIndex >= 0
      ? Math.max(visibleCount, maxPendingIndex + 1)
      : visibleCount;

  const nextExpandedIds = new Set(expandedIds);
  for (const stepId of pendingExtraStepIds) {
    if (effectiveLessonSteps.some((step) => step.id === stepId)) {
      nextExpandedIds.add(stepId);
    }
  }

  return { visibleCount: nextVisibleCount, expandedIds: nextExpandedIds };
}

function resolveInitialUiState(
  effectiveLessonSteps: JournalStep[],
  isProgramComplete: boolean,
  existingSession: ReturnType<typeof useStudentSession>["data"],
  showOnlyCompleted: boolean,
  pendingExtraStepIds: Set<string> = new Set(),
) {
  let result: { visibleCount: number; expandedIds: Set<string> };

  if (existingSession) {
    const gradedStepIds = new Set(
      existingSession.completions.map((c) => c.stepId),
    );

    if (showOnlyCompleted) {
      result = {
        visibleCount: effectiveLessonSteps.length,
        expandedIds: new Set(effectiveLessonSteps.map((step) => step.id)),
      };
    } else {
      const maxGradedIndex = getMaxStepIndex(effectiveLessonSteps, gradedStepIds);

      if (maxGradedIndex >= 0 && !isProgramComplete) {
        result = {
          visibleCount: Math.min(
            Math.max(INITIAL_VISIBLE_STEPS, maxGradedIndex + 1),
            effectiveLessonSteps.length,
          ),
          expandedIds: new Set([effectiveLessonSteps[maxGradedIndex]!.id]),
        };
      } else if (isProgramComplete) {
        result = {
          visibleCount: effectiveLessonSteps.length,
          expandedIds: new Set(effectiveLessonSteps.map((step) => step.id)),
        };
      } else {
        result = {
          visibleCount: Math.min(
            INITIAL_VISIBLE_STEPS,
            effectiveLessonSteps.length,
          ),
          expandedIds: effectiveLessonSteps[0]
            ? new Set([effectiveLessonSteps[0].id])
            : new Set<string>(),
        };
      }
    }
  } else {
    result = {
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

  if (!showOnlyCompleted) {
    return applyPendingExtraUiState(
      effectiveLessonSteps,
      result.visibleCount,
      result.expandedIds,
      pendingExtraStepIds,
    );
  }

  return result;
}

export function useLessonPage(props: LessonPageProps) {
  const {
    groupId,
    groupName,
    subjectName,
    studentId,
    steps,
    allSteps,
    hasNextLevel,
    prefetchedSessionSteps,
    nextLevelSteps: initialNextLevelSteps,
    stepCompletions,
    nextStudent,
    totalHours,
    initialSession,
    sessionDate,
  } = props;

  const [fetchedNextLevelSteps, setFetchedNextLevelSteps] = useState<JournalStep[]>(
    initialNextLevelSteps,
  );
  const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false);

  const nextLevelSteps = useMemo(
    () => [...prefetchedSessionSteps, ...fetchedNextLevelSteps],
    [prefetchedSessionSteps, fetchedNextLevelSteps],
  );

  const { message } = App.useApp();
  const router = useRouter();
  const { dateFilter, journalHref } = useJournalDate({
    allowedGroupIds: [groupId],
    defaultGroupId: groupId,
  });
  const { initSessionCompletions, setSessionStepState, setExtraAssignmentGrade } =
    useJournalStore();

  const { data: teachingSession } = useTeachingSession(groupId, dateFilter);
  const showOnlyCompleted = shouldShowOnlyCompletedLessonSteps(
    dateFilter,
    teachingSession,
  );

  const { data: existingSession, isLoading: isSessionLoading } =
    useStudentSession(studentId, dateFilter, groupId, {
      initialSession,
      seededDate: sessionDate,
    });
  const createSession = useCreateSession();

  const { data: extraInstancesData, refetch: refetchExtraInstances } =
    useSessionExtraAssignments(studentId, dateFilter, {
      mode: showOnlyCompleted ? 'history' : 'active',
    });
  const extraInstances = extraInstancesData ?? EMPTY_EXTRA_INSTANCES;
  const gradeExtraAssignment = useGradeExtraAssignment(studentId, dateFilter);
  const clearExtraGrade = useClearExtraAssignmentGrade(studentId, dateFilter);

  const [assignModalStepId, setAssignModalStepId] = useState<string | null>(
    null,
  );
  const [assignModalStepLabel, setAssignModalStepLabel] = useState<
    string | null
  >(null);

  const isProgramComplete = useMemo(
    () => checkProgramComplete(allSteps, stepCompletions),
    [allSteps, stepCompletions],
  );
  const hasNoSteps = allSteps.length === 0;

  const sessionStepsOutsideLevel = useMemo(
    () => mapSessionStepsOutsideLevel(allSteps, nextLevelSteps, existingSession),
    [allSteps, nextLevelSteps, existingSession],
  );

  const sessionDataKey = buildSessionDataKey(
    studentId,
    dateFilter,
    existingSession,
  );

  const sessionStepStates = useJournalStore(
    selectSessionStepStates(sessionDataKey),
  );

  const extraAssignmentGrades = useJournalStore(
    selectExtraAssignmentGrades(sessionDataKey),
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

  const pendingExtraStepIds = useMemo(
    () =>
      new Set(
        showOnlyCompleted
          ? []
          : extraInstances
              .filter((instance) => instance.completion === null)
              .map((instance) => instance.displayStepId),
      ),
    [extraInstances, showOnlyCompleted],
  );

  const extraLinkedSteps = useMemo(() => {
    if (extraInstances.length === 0) return [];
    const stepIds = new Set(
      extraInstances.map((instance) => instance.displayStepId),
    );
    return allSteps.filter((step) => stepIds.has(step.id));
  }, [allSteps, extraInstances]);

  const lessonSteps = useMemo(() => {
    if (isProgramComplete) return allSteps;

    const built = buildLessonSteps(
      allSteps,
      steps,
      existingSession?.completions ?? [],
      sessionStepsOutsideLevel,
      [...loadedNextLevelSteps, ...extraLinkedSteps],
    );

    if (showOnlyCompleted) {
      return filterStepsForDayHistory(
        buildLessonSteps(
          allSteps,
          steps,
          existingSession?.completions ?? [],
          sessionStepsOutsideLevel,
          [...loadedNextLevelSteps, ...extraLinkedSteps],
        ),
        existingSession?.completions,
        extraInstances,
      );
    }

    return built;
  }, [
    allSteps,
    steps,
    existingSession,
    isProgramComplete,
    loadedNextLevelSteps,
    extraLinkedSteps,
    extraInstances,
    sessionStepsOutsideLevel,
    showOnlyCompleted,
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
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);
  const uiInitKey = `${sessionDataKey}:${showOnlyCompleted}`;

  const isSessionReady = !isSessionLoading && loadedSessionKey === uiInitKey;

  const resolvedStepStates = useMemo(() => {
    const baseline = buildInitialStepStates(
      lessonSteps,
      existingSession?.completions,
      stepCompletions,
    );
    return { ...baseline, ...sessionStepStates };
  }, [
    lessonSteps,
    existingSession,
    stepCompletions,
    sessionStepStates,
  ]);

  const resolvedExtraGradeStates = useMemo(() => {
    const baseline = buildInitialExtraGradeStates(extraInstances);
    return { ...baseline, ...extraAssignmentGrades };
  }, [extraInstances, extraAssignmentGrades]);

  useEffect(() => {
    if (isSessionLoading || loadedSessionKey === uiInitKey) return;

    const effectiveLessonSteps = isProgramComplete
      ? allSteps
      : showOnlyCompleted
        ? filterStepsForDayHistory(
            buildLessonSteps(
              allSteps,
              steps,
              existingSession?.completions ?? [],
              sessionStepsOutsideLevel,
              [
                ...nextLevelSteps.slice(0, sessionNextLevelLoadedCount),
                ...extraLinkedSteps,
              ],
            ),
            existingSession?.completions,
            extraInstances,
          )
        : buildLessonSteps(
            allSteps,
            steps,
            existingSession?.completions ?? [],
            sessionStepsOutsideLevel,
            [
              ...nextLevelSteps.slice(0, sessionNextLevelLoadedCount),
              ...extraLinkedSteps,
            ],
          );

    if (existingSession) {
      setAttendance(existingSession.attendance);
      setLateMinutes(existingSession.lateMinutes ?? 5);
      initSessionCompletions(
        sessionDataKey,
        buildInitialStepStates(
          effectiveLessonSteps,
          existingSession.completions,
          stepCompletions,
        ),
      );
    } else {
      setAttendance("PRESENT");
      setLateMinutes(5);
      initSessionCompletions(
        sessionDataKey,
        buildInitialStepStates(
          effectiveLessonSteps,
          undefined,
          stepCompletions,
        ),
      );
    }

    const { visibleCount: nextVisibleCount, expandedIds: nextExpandedIds } =
      resolveInitialUiState(
        effectiveLessonSteps,
        isProgramComplete,
        existingSession,
        showOnlyCompleted,
        pendingExtraStepIds,
      );
    setVisibleCount(nextVisibleCount);
    setExpandedIds(nextExpandedIds);
    setLoadedSessionKey(uiInitKey);
  }, [
    isSessionLoading,
    loadedSessionKey,
    uiInitKey,
    sessionDataKey,
    existingSession,
    isProgramComplete,
    allSteps,
    steps,
    sessionStepsOutsideLevel,
    nextLevelSteps,
    sessionNextLevelLoadedCount,
    stepCompletions,
    showOnlyCompleted,
    initSessionCompletions,
    extraLinkedSteps,
    extraInstances,
    pendingExtraStepIds,
  ]);

  const historyStepIds = useMemo(() => {
    const stepIds = new Set(
      extraInstances.map((instance) => instance.displayStepId),
    );
    for (const completion of existingSession?.completions ?? []) {
      stepIds.add(completion.stepId);
    }
    return stepIds;
  }, [extraInstances, existingSession]);

  const requiredVisibleCount = useMemo(() => {
    if (showOnlyCompleted || historyStepIds.size === 0) return 0;
    const maxIndex = getMaxStepIndex(lessonSteps, historyStepIds);
    return maxIndex >= 0 ? Math.min(maxIndex + 1, lessonSteps.length) : 0;
  }, [showOnlyCompleted, historyStepIds, lessonSteps]);

  const effectiveVisibleCount = Math.max(visibleCount, requiredVisibleCount);

  const autoExpandedIds = useMemo(() => {
    if (showOnlyCompleted) return new Set<string>();
    const ids = new Set<string>();
    for (const stepId of historyStepIds) {
      if (lessonSteps.some((step) => step.id === stepId)) {
        ids.add(stepId);
      }
    }
    return ids;
  }, [showOnlyCompleted, historyStepIds, lessonSteps]);

  const effectiveExpandedIds = useMemo(() => {
    const next = new Set(expandedIds);
    for (const stepId of autoExpandedIds) {
      next.add(stepId);
    }
    return next;
  }, [expandedIds, autoExpandedIds]);

  const visibleSteps = lessonSteps.slice(0, effectiveVisibleCount);
  const gradedStepCount = useMemo(
    () =>
      visibleSteps.filter(
        (step) => resolvedStepStates[step.id]?.grade !== null,
      ).length,
    [visibleSteps, resolvedStepStates],
  );
  const hasMore = effectiveVisibleCount < lessonSteps.length;
  const allVisibleStepsPassed =
    visibleSteps.length > 0 &&
    visibleSteps.every((step) =>
      isStepPassed(resolvedStepStates[step.id]?.grade),
    );
  const canLoadNextLevel =
    !showOnlyCompleted &&
    !isProgramComplete &&
    !hasMore &&
    allVisibleStepsPassed &&
    hasNextLevel &&
    (nextLevelLoadedCount < nextLevelSteps.length ||
      fetchedNextLevelSteps.length === 0);

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

  const handleClearSessionCompletions = () => {
    initSessionCompletions(
      sessionDataKey,
      Object.fromEntries(
        lessonSteps.map((step) => [step.id, EMPTY_STEP_GRADE_STATE]),
      ),
    );
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
    setSessionStepState(sessionDataKey, stepId, state);
  };

  const loadMoreSteps = () => {
    setVisibleCount((count) =>
      Math.min(count + LOAD_MORE_STEPS_COUNT, lessonSteps.length),
    );
  };

  const loadNextLevelSteps = async () => {
    let stepsPool = nextLevelSteps;

    if (hasNextLevel && fetchedNextLevelSteps.length === 0) {
      setIsLoadingNextLevel(true);
      try {
        const fetched = await getNextLevelJournalSteps(studentId, groupId);
        setFetchedNextLevelSteps(fetched);
        stepsPool = [...prefetchedSessionSteps, ...fetched];
      } catch (err) {
        message.error(
          err instanceof Error
            ? err.message
            : "Не удалось загрузить следующий уровень",
        );
        return;
      } finally {
        setIsLoadingNextLevel(false);
      }
    }

    const nextCount = Math.min(
      nextLevelLoadedCount + LOAD_MORE_STEPS_COUNT,
      stepsPool.length,
    );
    const newlyLoaded = stepsPool.slice(nextLevelLoadedCount, nextCount);
    setNextLevelUserExtraBySessionKey((prev) => ({
      ...prev,
      [sessionDataKey]: nextCount - sessionNextLevelLoadedCount,
    }));
    setVisibleCount((count) => count + newlyLoaded.length);
    if (newlyLoaded[0]) {
      setExpandedIds(new Set([newlyLoaded[0].id]));
    }
  };

  const ensureSession = async (): Promise<string | null> => {
    if (existingSession?.id) return existingSession.id;

    try {
      const session = await createSession.mutateAsync({
        studentId,
        groupId,
        date: toSessionDate(dateFilter).toISOString(),
        attendance,
        lateMinutes: attendance === "LATE" ? lateMinutes : null,
        note: null,
        completions: [],
      });
      return session.id;
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Не удалось создать занятие",
      );
      return null;
    }
  };

  const handleOpenAssignModal = (stepId: string, stepLabel: string) => {
    setAssignModalStepId(stepId);
    setAssignModalStepLabel(stepLabel);
  };

  const handleCloseAssignModal = () => {
    setAssignModalStepId(null);
    setAssignModalStepLabel(null);
  };

  const handleExtraAssigned = () => {
    void refetchExtraInstances();
    handleCloseAssignModal();
  };

  const updateExtraAssignmentState = (
    instanceId: string,
    state: StepGradeState,
  ) => {
    setExtraAssignmentGrade(sessionDataKey, instanceId, state);
  };

  const saveExtraGrades = async () => {
    const instanceById = new Map(
      extraInstances.map((instance) => [instance.id, instance]),
    );
    const instanceIds = new Set([
      ...extraInstances.map((instance) => instance.id),
      ...Object.keys(extraAssignmentGrades),
    ]);
    const tasks: Promise<unknown>[] = [];

    for (const instanceId of instanceIds) {
      const instance = instanceById.get(instanceId);
      const local = resolvedExtraGradeStates[instanceId];
      if (!local) continue;

      const serverGrade = instance?.completion?.grade ?? null;
      const serverNote = instance?.completion?.note ?? "";
      const localGrade = local.grade;
      const localNote = local.note || null;

      if (localGrade === null) {
        if (serverGrade !== null) {
          tasks.push(clearExtraGrade.mutateAsync(instanceId));
        }
        continue;
      }

      if (
        localGrade !== serverGrade ||
        localNote !== (serverNote || null)
      ) {
        tasks.push(
          gradeExtraAssignment.mutateAsync({
            id: instanceId,
            grade: localGrade as 3 | 4 | 5,
            note: localNote,
          }),
        );
      }
    }

    if (tasks.length === 0) return true;

    try {
      await Promise.all(tasks);
      await refetchExtraInstances();
      return true;
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Ошибка сохранения доп. заданий",
      );
      return false;
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

    try {
      await createSession.mutateAsync({
        studentId,
        groupId,
        date: toSessionDate(dateFilter).toISOString(),
        attendance,
        lateMinutes: attendance === "LATE" ? lateMinutes : null,
        note: null,
        completions,
      });

      if (attendance !== "ABSENT") {
        const hasExtraWork =
          extraInstances.length > 0 ||
          Object.keys(extraAssignmentGrades).length > 0;
        if (hasExtraWork) {
          const extraSaved = await saveExtraGrades();
          if (!extraSaved) return false;
        }
      }

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
    router.push(journalHref("/journal"));
  };

  const handleSaveAndNext = async () => {
    const saved = await saveSession();
    if (!saved) return;

    if (nextStudent) {
      message.success(`Переход к ${nextStudent.name}`);
      router.push(journalHref(`/journal/${nextStudent.id}`));
    } else {
      message.success("Урок сохранён. Это последний ученик в группе");
      router.push(journalHref("/journal"));
    }
  };

  const todayLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateFilter}T12:00:00`));

  return {
    ...props,
    todayLabel,
    journalBackHref: journalHref("/journal"),
    isProgramComplete,
    hasNoSteps,
    attendance,
    lateMinutes,
    visibleSteps,
    lessonSteps,
    expandedIds: effectiveExpandedIds,
    resolvedStepStates,
    hasMore,
    canLoadNextLevel,
    cumulativeHoursByAllSteps,
    isSessionReady,
    isSaving:
      createSession.isPending ||
      gradeExtraAssignment.isPending ||
      clearExtraGrade.isPending,
    gradedStepCount,
    getStepTotalHours,
    handleAttendanceChange,
    handleClearSessionCompletions,
    toggleExpand,
    updateStepState,
    loadMoreSteps,
    loadNextLevelSteps,
    handleSave,
    handleSaveAndNext,
    isLoadingNextLevel,
    sessionId: existingSession?.id ?? null,
    sessionDate: dateFilter,
    extraInstances,
    resolvedExtraGradeStates,
    assignModalStepId,
    assignModalStepLabel,
    handleOpenAssignModal,
    handleCloseAssignModal,
    ensureSession,
    handleExtraAssigned,
    updateExtraAssignmentState,
  };
}

export type UseLessonPageResult = ReturnType<typeof useLessonPage>;
