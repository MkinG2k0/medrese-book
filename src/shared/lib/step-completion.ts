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

export function isProgramComplete<T extends { id: string }>(
  allSteps: T[],
  completions: { stepId: string; grade: number }[],
): boolean {
  if (allSteps.length === 0) return false;

  const passedStepIds = new Set(
    completions.filter((c) => isStepPassed(c.grade)).map((c) => c.stepId),
  );
  return allSteps.every((step) => passedStepIds.has(step.id));
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

export function sortStepsByLevel<
  T extends { order: number; levelNumber?: number },
>(steps: T[]): T[] {
  return [...steps].sort((a, b) => {
    const levelDiff = (a.levelNumber ?? 0) - (b.levelNumber ?? 0);
    return levelDiff !== 0 ? levelDiff : a.order - b.order;
  });
}

export function countConsecutiveLoadedNextLevelSteps<
  T extends { id: string },
>(
  nextLevelSteps: T[],
  loadedStepIds: Set<string>,
): number {
  let count = 0;
  for (const step of nextLevelSteps) {
    if (!loadedStepIds.has(step.id)) break;
    count += 1;
  }
  return count;
}

export function buildLessonSteps<
  T extends { id: string; order: number; levelNumber?: number },
>(
  allSteps: T[],
  incompleteSteps: T[],
  sessionCompletions: { stepId: string }[] = [],
  sessionStepsOutsideLevel: T[] = [],
  extraSteps: T[] = [],
): T[] {
  const sessionStepIds = new Set(sessionCompletions.map((c) => c.stepId));
  const includeIds = new Set([
    ...incompleteSteps.map((step) => step.id),
    ...sessionStepIds,
    ...extraSteps.map((step) => step.id),
  ]);

  const stepsById = new Map<string, T>();
  for (const step of allSteps) {
    if (includeIds.has(step.id)) stepsById.set(step.id, step);
  }
  for (const step of sessionStepsOutsideLevel) {
    if (sessionStepIds.has(step.id)) stepsById.set(step.id, step);
  }
  for (const step of extraSteps) {
    stepsById.set(step.id, step);
  }

  return sortStepsByLevel([...stepsById.values()]);
}
