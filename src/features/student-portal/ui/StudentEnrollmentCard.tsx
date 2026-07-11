import { Card } from "antd";

import { StudentMetricsCards } from "@/features/analytics/ui/StudentMetricsCards";
import type { StudentEnrollmentDashboardItem } from "@/features/student-portal/actions/student-actions";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type StudentEnrollmentCardProps = {
  enrollment: StudentEnrollmentDashboardItem;
};

export function StudentEnrollmentCard({
  enrollment,
}: StudentEnrollmentCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <Title level={4}>
            {enrollment.subjectName} — {enrollment.groupName}
          </Title>
          <Text type="secondary">{enrollment.levelTitle}</Text>
        </div>

        <div>
          <Text className="mb-2 block">
            Прогресс: шаг {enrollment.currentStepIdx + 1} из{" "}
            {enrollment.totalSteps}
          </Text>
          <ProgressBar
            current={enrollment.currentStepIdx}
            total={enrollment.totalSteps}
          />
        </div>

        <StudentMetricsCards
          metrics={enrollment.periodMetrics}
          variant="portal"
        />
      </div>
    </Card>
  );
}
