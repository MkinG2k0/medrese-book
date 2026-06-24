"use client";

import type { LessonPageProps } from "@/features/journal/lib/lesson-types";
import { useLessonPage } from "@/features/journal/model/use-lesson-page";
import { LessonPageHeader } from "@/features/journal/ui/lesson/LessonPageHeader";
import { LessonSaveBar } from "@/features/journal/ui/lesson/LessonSaveBar";
import { LessonStepsSection } from "@/features/journal/ui/lesson/LessonStepsSection";

export function LessonPage(props: LessonPageProps) {
  const lesson = useLessonPage(props);
  const currentStepNumber = lesson.currentStepIdx + 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-24">
      <LessonPageHeader
        studentId={lesson.studentId}
        studentName={lesson.studentName}
        todayLabel={lesson.todayLabel}
        levelNumber={lesson.levelNumber}
        hasNoSteps={lesson.hasNoSteps}
        isProgramComplete={lesson.isProgramComplete}
        currentStepNumber={currentStepNumber}
        totalSteps={lesson.totalSteps}
        totalProgramSteps={lesson.totalProgramSteps}
        totalHours={lesson.totalHours}
        allSteps={lesson.allSteps}
        cumulativeHoursByAllSteps={lesson.cumulativeHoursByAllSteps}
      />

      <LessonStepsSection
        isProgramComplete={lesson.isProgramComplete}
        hasNoSteps={lesson.hasNoSteps}
        attendance={lesson.attendance}
        lateMinutes={lesson.lateMinutes}
        isSessionReady={lesson.isSessionReady}
        visibleSteps={lesson.visibleSteps}
        expandedIds={lesson.expandedIds}
        resolvedStepStates={lesson.resolvedStepStates}
        hasMore={lesson.hasMore}
        canLoadNextLevel={lesson.canLoadNextLevel}
        isLoadingNextLevel={lesson.isLoadingNextLevel}
        gradedStepCount={lesson.gradedStepCount}
        getStepTotalHours={lesson.getStepTotalHours}
        onAttendanceChange={lesson.handleAttendanceChange}
        onClearSessionCompletions={lesson.handleClearSessionCompletions}
        onToggleExpand={lesson.toggleExpand}
        onStepStateChange={lesson.updateStepState}
        onLoadMoreSteps={lesson.loadMoreSteps}
        onLoadNextLevelSteps={lesson.loadNextLevelSteps}
      />

      <LessonSaveBar
        nextStudent={lesson.nextStudent}
        isSaving={lesson.isSaving}
        onSave={lesson.handleSave}
        onSaveAndNext={lesson.handleSaveAndNext}
      />
    </div>
  );
}

export type { LessonPageProps } from "@/features/journal/lib/lesson-types";
