import type { JournalStep } from "@/features/journal/actions/journal-actions";
import type { ClientDaySession } from "@/features/journal/lib/get-student-session";

export function mapSessionStepsOutsideLevel(
  allSteps: JournalStep[],
  nextLevelSteps: JournalStep[],
  session: ClientDaySession | null | undefined,
): JournalStep[] {
  if (!session?.completions.length) return [];

  const currentLevelStepIds = new Set(allSteps.map((step) => step.id));
  const stepById = new Map(
    [...allSteps, ...nextLevelSteps].map((step) => [step.id, step]),
  );

  return session.completions
    .filter((completion) => !currentLevelStepIds.has(completion.stepId))
    .map((completion) => stepById.get(completion.stepId))
    .filter((step): step is JournalStep => step != null);
}

export function buildSessionDataKey(
  studentId: string,
  dateFilter: string,
  session: ClientDaySession | null | undefined,
): string {
  const sessionKey = `${studentId}:${dateFilter}`;
  return session
    ? `${sessionKey}:${session.id}:${session.completions.map((c) => c.stepId).join(",")}`
    : `${sessionKey}:none`;
}
