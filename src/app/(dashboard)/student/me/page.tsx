import { Table, Tag } from "antd";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/features/program-admin/ui/BlockRenderer";
import { getStudentProfile } from "@/features/student-portal/actions/student-actions";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";
import { formatDate } from "@/shared/lib/utils";

export default async function StudentMePage() {
  await requireRole("STUDENT");
  const profile = await getStudentProfile();

  if (!profile) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>{profile.name}</Title>
      <Text className="text-[#8a8375]">
        {profile.levelTitle}
      </Text>

      <div>
        <Text className="mb-2 block">
          Прогресс: шаг {profile.currentStepIdx + 1} из {profile.totalSteps}
        </Text>
        <ProgressBar
          current={profile.currentStepIdx}
          total={profile.totalSteps}
        />
      </div>

      {profile.currentStep && (
        <div>
          <Title level={4} className="!text-[#E8E0D0]">
            Текущий урок: {profile.currentStep.title}
          </Title>
          <BlockRenderer blocks={profile.currentStep.content.blocks} />
        </div>
      )}

      <div>
        <Title level={4} className="!text-[#E8E0D0]">
          Награды
        </Title>
        {profile.awards.length === 0 ? (
          <Text className="text-[#8a8375]">
            Пока нет наград
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.awards.map((award) => (
              <Tag key={award.id} color="gold">
                {award.title} ({award.type})
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div>
        <Title level={4} className="!text-[#E8E0D0]">
          История занятий
        </Title>
        <Table
          dataSource={profile.sessions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Дата",
              dataIndex: "date",
              key: "date",
              render: (d: Date) => formatDate(d),
            },
            {
              title: "Посещаемость",
              dataIndex: "attendance",
              key: "attendance",
              render: (a: string) => <Tag>{a}</Tag>,
            },
            {
              title: "Оценки",
              key: "grades",
              render: (_, record) =>
                record.completions.map((c) => c.grade).join(", ") || "—",
            },
          ]}
        />
      </div>
    </div>
  );
}
