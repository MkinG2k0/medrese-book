export const PASSING_GRADE = 3;

export function isStepPassed(grade: number | null | undefined): boolean {
  return grade != null && grade >= PASSING_GRADE;
}

export function getCompletionsByStepId<T extends { stepId: string }>(
  completions: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const completion of completions) {
    map.set(completion.stepId, completion);
  }
  return map;
}

export function filterIncompleteSteps<T extends { id: string }>(
  allSteps: T[],
  completionsByStepId: Map<string, { grade: number }>,
): T[] {
  return allSteps.filter((step) => {
    const completion = completionsByStepId.get(step.id);
    return !isStepPassed(completion?.grade);
  });
}

export function sumPassedStepHours<T extends { id: string; hours: number }>(
  allSteps: T[],
  completionsByStepId: Map<string, { grade: number }>,
): number {
  return allSteps.reduce((sum, step) => {
    const completion = completionsByStepId.get(step.id);
    return isStepPassed(completion?.grade) ? sum + step.hours : sum;
  }, 0);
}

export function countConsecutivePassedSteps<T extends { id: string }>(
  allSteps: T[],
  completionsByStepId: Map<string, { grade: number }>,
): number {
  let count = 0;
  for (const step of allSteps) {
    const completion = completionsByStepId.get(step.id);
    if (!isStepPassed(completion?.grade)) break;
    count += 1;
  }
  return count;
}

export function buildLessonSteps<T extends { id: string }>(
  allSteps: T[],
  incompleteSteps: T[],
  sessionStepIds: string[],
): T[] {
  const includeIds = new Set([
    ...incompleteSteps.map((step) => step.id),
    ...sessionStepIds,
  ]);
  return allSteps.filter((step) => includeIds.has(step.id));
}
