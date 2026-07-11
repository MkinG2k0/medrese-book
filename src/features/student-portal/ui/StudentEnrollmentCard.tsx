import { Button, Card } from "antd";
import { BookOutlined, HistoryOutlined } from "@ant-design/icons";

import { StudentMetricsCards } from "@/features/analytics/ui/StudentMetricsCards";
import type { StudentEnrollmentDashboardItem } from "@/features/student-portal/actions/student-actions";
import { buildStudentPortalHref } from "@/features/student-portal/lib/student-portal-query";
import { StudentPortalGroupLink } from "@/features/student-portal/ui/StudentPortalGroupLink";
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

        <div className="flex flex-wrap gap-2">
          <StudentPortalGroupLink
            href={buildStudentPortalHref("/student/lessons", enrollment.groupId)}
            groupId={enrollment.groupId}
          >
            <Button type="default" icon={<BookOutlined />}>
              Уроки
            </Button>
          </StudentPortalGroupLink>
          <StudentPortalGroupLink
            href={buildStudentPortalHref(
              "/student/history",
              enrollment.groupId,
            )}
            groupId={enrollment.groupId}
          >
            <Button type="default" icon={<HistoryOutlined />}>
              История
            </Button>
          </StudentPortalGroupLink>
        </div>
      </div>
    </Card>
  );
}
