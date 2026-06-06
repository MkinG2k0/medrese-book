import type { StudentSession } from "@/entities/session/api/use-sessions";
import type { JournalStep } from "@/features/journal/actions/journal-actions";
import type { StepContent } from "@/shared/lib/validations/step";

export function mapSessionStepsOutsideLevel(
  allSteps: JournalStep[],
  session: StudentSession | null | undefined,
): JournalStep[] {
  if (!session?.completions) return [];

  const currentLevelStepIds = new Set(allSteps.map((step) => step.id));
  return session.completions
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
}

export function buildSessionDataKey(
  studentId: string,
  dateFilter: string,
  session: StudentSession | null | undefined,
): string {
  const sessionKey = `${studentId}:${dateFilter}`;
  return session
    ? `${sessionKey}:${session.id}:${session.completions.map((c) => c.stepId).join(",")}`
    : `${sessionKey}:none`;
}
