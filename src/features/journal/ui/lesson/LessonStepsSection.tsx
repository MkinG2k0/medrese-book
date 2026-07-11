import { Fragment, useMemo } from "react";

import { Button } from "antd";

import type { SessionExtraAssignmentInstance } from "@/entities/extra-assignment";
import { AssignExtraAssignmentModal } from "@/features/extra-assignments/ui/AssignExtraAssignmentModal";

import type { JournalStep } from "@/features/journal/actions/journal-actions";
import { AttendanceButtons } from "@/features/journal/ui/AttendanceButtons";
import {
  EMPTY_STEP_GRADE_STATE,
  StepCard,
  type StepGradeState,
} from "@/features/journal/ui/StepCard";
import Text from "@/shared/ui/Text";

import { LevelProgramDivider } from "./LevelProgramDivider";

type LessonStepsSectionProps = {
  isProgramComplete: boolean;
  hasNoSteps: boolean;
  attendance: "PRESENT" | "LATE" | "ABSENT";
  lateMinutes: number;
  isSessionReady: boolean;
  visibleSteps: JournalStep[];
  expandedIds: Set<string>;
  resolvedStepStates: Record<string, StepGradeState>;
  hasMore: boolean;
  canLoadNextLevel: boolean;
  isLoadingNextLevel?: boolean;
  gradedStepCount: number;
  getStepTotalHours: (step: JournalStep) => number;
  onAttendanceChange: (
    value: "PRESENT" | "LATE" | "ABSENT",
    minutes?: number,
  ) => void;
  onClearSessionCompletions: () => void;
  onToggleExpand: (stepId: string) => void;
  onStepStateChange: (stepId: string, state: StepGradeState) => void;
  onLoadMoreSteps: () => void;
  onLoadNextLevelSteps: () => void | Promise<void>;
  studentId: string;
  sessionId: string | null;
  sessionDate: string;
  subjectId: string;
  extraInstances: SessionExtraAssignmentInstance[];
  assignModalStepId: string | null;
  assignModalStepLabel: string | null;
  onOpenAssignModal: (stepId: string, stepLabel: string) => void;
  onCloseAssignModal: () => void;
  onEnsureSession: () => Promise<string | null>;
  onExtraAssigned: () => void;
  extraGradeStates: Record<string, StepGradeState>;
  onExtraStateChange: (instanceId: string, state: StepGradeState) => void;
};

export function LessonStepsSection({
  isProgramComplete,
  hasNoSteps,
  attendance,
  lateMinutes,
  isSessionReady,
  visibleSteps,
  expandedIds,
  resolvedStepStates,
  hasMore,
  canLoadNextLevel,
  isLoadingNextLevel = false,
  gradedStepCount,
  getStepTotalHours,
  onAttendanceChange,
  onClearSessionCompletions,
  onToggleExpand,
  onStepStateChange,
  onLoadMoreSteps,
  onLoadNextLevelSteps,
  studentId,
  sessionId,
  sessionDate,
  subjectId,
  extraInstances,
  assignModalStepId,
  assignModalStepLabel,
  onOpenAssignModal,
  onCloseAssignModal,
  onEnsureSession,
  onExtraAssigned,
  extraGradeStates,
  onExtraStateChange,
}: LessonStepsSectionProps) {
  const instancesByStep = useMemo(() => {
    const map = new Map<string, SessionExtraAssignmentInstance[]>();
    for (const instance of extraInstances) {
      const list = map.get(instance.displayStepId) ?? [];
      list.push(instance);
      map.set(instance.displayStepId, list);
    }
    return map;
  }, [extraInstances]);

  return (
    <>
      {hasNoSteps && (
        <Text type="secondary">
          Для этого уровня не настроены шаги программы. Обратитесь к
          администратору.
        </Text>
      )}

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
          onChange={onAttendanceChange}
          disabled={!isSessionReady}
          gradedStepCount={gradedStepCount}
          onClearCompletions={onClearSessionCompletions}
        />
      </div>

      {attendance !== "ABSENT" && !hasNoSteps && (
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
                    onToggleExpand={() => onToggleExpand(step.id)}
                    onStateChange={(state) => onStepStateChange(step.id, state)}
                    extraInstances={instancesByStep.get(step.id) ?? []}
                    extraGradeStates={extraGradeStates}
                    onGiveExtraAssignment={() =>
                      onOpenAssignModal(
                        step.id,
                        `Шаг ${step.order}: ${step.title}`,
                      )
                    }
                    onExtraStateChange={onExtraStateChange}
                  />
                </Fragment>
              );
            })}
          </div>
          {hasMore && (
            <Button
              type="link"
              onClick={onLoadMoreSteps}
              className="self-center"
            >
              Загрузить ещё
            </Button>
          )}
          {canLoadNextLevel && (
            <Button
              type="link"
              loading={isLoadingNextLevel}
              onClick={() => void onLoadNextLevelSteps()}
              className="self-center"
            >
              Загрузить шаги
            </Button>
          )}
        </div>
      )}

      <AssignExtraAssignmentModal
        open={assignModalStepId !== null}
        studentId={studentId}
        sessionId={sessionId}
        subjectId={subjectId}
        displayStepId={assignModalStepId ?? ""}
        displayStepLabel={assignModalStepLabel ?? undefined}
        date={sessionDate}
        onClose={onCloseAssignModal}
        onAssigned={onExtraAssigned}
        onEnsureSession={onEnsureSession}
      />
    </>
  );
}
