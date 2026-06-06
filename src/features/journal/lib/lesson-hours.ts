export function buildCumulativeHoursMap(
  steps: { id: string; hours: number }[],
  initialHours = 0,
) {
  const result: Record<string, number> = {};
  let running = initialHours;
  for (const step of steps) {
    running += step.hours;
    result[step.id] = running;
  }
  return result;
}
