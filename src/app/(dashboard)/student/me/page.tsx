import { Tag } from "antd";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/features/program-admin/ui/BlockRenderer";
import { getStudentProfile } from "@/features/student-portal/actions/student-actions";
import { StudentSessionsTable } from "@/features/student-portal/ui/StudentSessionsTable";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

export default async function StudentMePage() {
  await requireRole("STUDENT");
  const profile = await getStudentProfile();

  if (!profile) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>{profile.name}</Title>
      <Text type="secondary">{profile.levelTitle}</Text>

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
          <Title level={4}>Текущий урок: {profile.currentStep.title}</Title>
          <BlockRenderer blocks={profile.currentStep.content.blocks} />
        </div>
      )}

      <div>
        <Title level={4}>Награды</Title>
        {profile.awards.length === 0 ? (
          <Text type="secondary">Пока нет наград</Text>
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
        <Title level={4}>История занятий</Title>
        <StudentSessionsTable sessions={profile.sessions} />
      </div>
    </div>
  );
}
