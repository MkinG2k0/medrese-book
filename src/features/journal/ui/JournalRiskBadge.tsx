import { Tag, Tooltip } from "antd";

import type { RiskFlag } from "@/shared/lib/student-metrics/types";

type JournalRiskBadgeProps = {
  riskFlags: RiskFlag[];
  studentName: string;
};

function getCombinedAriaLabel(
  studentName: string,
  riskFlags: RiskFlag[],
): string {
  const parts: string[] = [];
  if (riskFlags.includes("TIME_NORM")) {
    parts.push("превышен норматив");
  }
  if (riskFlags.includes("ATTENDANCE")) {
    parts.push("много пропусков");
  }
  return `${studentName}: ${parts.join("; ")}`;
}

export function JournalRiskBadge({
  riskFlags,
  studentName,
}: JournalRiskBadgeProps) {
  if (riskFlags.length === 0) return null;

  const hasTimeNorm = riskFlags.includes("TIME_NORM");
  const hasAttendance = riskFlags.includes("ATTENDANCE");
  const combinedAriaLabel = getCombinedAriaLabel(studentName, riskFlags);

  if (hasTimeNorm && hasAttendance) {
    return (
      <span
        className="flex gap-1"
        aria-label={combinedAriaLabel}
      >
        <Tooltip title="Превышен норматив времени">
          <Tag color="warning" variant="filled" aria-label={`${studentName}: превышен норматив`}>
            Норматив
          </Tag>
        </Tooltip>
        <Tooltip title="Много пропусков">
          <Tag color="error" variant="filled" aria-label={`${studentName}: много пропусков`}>
            Пропуски
          </Tag>
        </Tooltip>
      </span>
    );
  }

  if (hasTimeNorm) {
    return (
      <Tooltip title="Превышен норматив времени">
        <Tag
          color="warning"
          variant="filled"
          aria-label={`${studentName}: превышен норматив`}
        >
          Норматив
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Много пропусков">
      <Tag
        color="error"
        variant="filled"
        aria-label={`${studentName}: много пропусков`}
      >
        Пропуски
      </Tag>
    </Tooltip>
  );
}
