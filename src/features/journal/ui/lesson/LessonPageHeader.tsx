import { ArrowLeftOutlined } from "@ant-design/icons";
import { Avatar, Button } from "antd";
import Link from "next/link";

import type { JournalStep } from "@/features/journal/actions/journal-actions";
import { StudentMetricsCards } from "@/features/analytics/ui/StudentMetricsCards";
import { getInitials } from "@/features/journal/lib/get-initials";
import type { StudentPeriodMetrics } from "@/shared/lib/student-metrics/types";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type LessonPageHeaderProps = {
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  subjectName: string;
  todayLabel: string;
  journalBackHref: string;
  levelNumber: number;
  hasNoSteps: boolean;
  isProgramComplete: boolean;
  currentStepNumber: number;
  totalSteps: number;
  totalProgramSteps: number;
  totalHours: number;
  allSteps: JournalStep[];
  cumulativeHoursByAllSteps: Record<string, number>;
  periodMetrics: StudentPeriodMetrics | null;
};

export function LessonPageHeader({
  studentId,
  studentName,
  groupId,
  groupName,
  subjectName,
  todayLabel,
  journalBackHref,
  levelNumber,
  hasNoSteps,
  isProgramComplete,
  currentStepNumber,
  totalSteps,
  totalProgramSteps,
  totalHours,
  allSteps,
  cumulativeHoursByAllSteps,
  periodMetrics,
}: LessonPageHeaderProps) {
  const lastStepId = allSteps[allSteps.length - 1]?.id ?? "";
  const completedTotalHours =
    cumulativeHoursByAllSteps[lastStepId] ?? totalHours;

  return (
    <>
      <Link href={journalBackHref} className="flex items-center gap-2 no-underline">
        <ArrowLeftOutlined />
        <Text>Все ученики · {todayLabel}</Text>
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size={56}>{getInitials(studentName)}</Avatar>
          <div className="flex flex-col gap-1">
            <Title level={3} className="!mb-0">
              {studentName}
            </Title>
            <Text type="secondary">
              {groupName} · {subjectName}
            </Text>
            <Text type="secondary">
              {hasNoSteps ? (
                <>Уровень {levelNumber} · Шаги не настроены</>
              ) : isProgramComplete ? (
                <>
                  Уровень {levelNumber} · Все {totalSteps} шагов пройдены ·
                  Итого {completedTotalHours} ч
                </>
              ) : (
                <>
                  Уровень {levelNumber} · Шаг {currentStepNumber} из{" "}
                  {totalProgramSteps} · Итого {totalHours} ч
                </>
              )}
            </Text>
          </div>
        </div>
        <Link href={`/journal/${studentId}/history?groupId=${groupId}`}>
          <Button type="link">История шагов</Button>
        </Link>
      </div>

      {periodMetrics ? (
        <StudentMetricsCards metrics={periodMetrics} variant="compact" />
      ) : null}
    </>
  );
}
