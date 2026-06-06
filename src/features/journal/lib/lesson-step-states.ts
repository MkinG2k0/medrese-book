import type { StepGradeState } from "@/features/journal/ui/StepCard";

import type { JournalStep } from "@/features/journal/actions/journal-actions";

import type { StepCompletionRecord } from "./lesson-types";

export function buildInitialStepStates(
  steps: JournalStep[],
  sessionCompletions?: StepCompletionRecord[],
  historicalCompletions?: StepCompletionRecord[],
): Record<string, StepGradeState> {
  const sessionByStep = new Map(
    sessionCompletions?.map((c) => [c.stepId, c]) ?? [],
  );
  const historicalByStep = new Map(
    historicalCompletions?.map((c) => [c.stepId, c]) ?? [],
  );

  return Object.fromEntries(
    steps.map((step) => {
      const source =
        sessionByStep.get(step.id) ?? historicalByStep.get(step.id);
      return [
        step.id,
        {
          grade: source?.grade ?? null,
          note: source?.note ?? "",
        },
      ];
    }),
  );
}
