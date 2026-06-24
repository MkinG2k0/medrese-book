import { Tag } from "antd";
import { notFound } from "next/navigation";

import { getStudentAwards } from "@/features/student-portal/actions/student-actions";
import { formatDate } from "@/shared/lib/utils";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

const AWARD_TYPE_LABELS: Record<string, string> = {
  STUDY: "Учёба",
  ACTIVITY: "Активность",
};

export default async function StudentAwardsPage() {
  await requireRole("STUDENT");
  const data = await getStudentAwards();

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>Награды</Title>

      {data.awards.length === 0 ? (
        <Text type="secondary">Пока нет наград</Text>
      ) : (
        <div className="flex flex-col gap-3">
          {data.awards.map((award) => (
            <div key={award.id} className="flex flex-wrap items-center gap-2">
              <Tag color="gold">{award.title}</Tag>
              <Text type="secondary">
                {AWARD_TYPE_LABELS[award.type] ?? award.type} ·{" "}
                {formatDate(award.date)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
