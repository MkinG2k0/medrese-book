import type { JournalStep } from "@/features/journal/actions/journal-actions";

export type StepCompletionRecord = {
  stepId: string;
  grade: number;
  note: string | null;
};

export type LessonPageProps = {
  studentId: string;
  studentName: string;
  currentStepIdx: number;
  levelNumber: number;
  totalSteps: number;
  totalProgramSteps: number;
  totalHours: number;
  steps: JournalStep[];
  allSteps: JournalStep[];
  nextLevelSteps: JournalStep[];
  stepCompletions: StepCompletionRecord[];
  nextStudent: { id: string; name: string } | null;
};
