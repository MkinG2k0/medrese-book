import type { JournalStep } from "@/features/journal/actions/journal-actions";

import type { ClientDaySession } from "@/features/journal/lib/get-student-session";
import type { RiskFlag, StudentPeriodMetrics } from "@/shared/lib/student-metrics/types";

export type StepCompletionRecord = {
  stepId: string;
  grade: number;
  note: string | null;
};

export type LessonPageProps = {
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  currentStepIdx: number;
  levelNumber: number;
  totalSteps: number;
  totalProgramSteps: number;
  totalHours: number;
  steps: JournalStep[];
  allSteps: JournalStep[];
  hasNextLevel: boolean;
  prefetchedSessionSteps: JournalStep[];
  nextLevelSteps: JournalStep[];
  stepCompletions: StepCompletionRecord[];
  nextStudent: { id: string; name: string } | null;
  initialSession: ClientDaySession | null;
  sessionDate: string;
  riskFlags: RiskFlag[];
  periodMetrics: StudentPeriodMetrics | null;
};
