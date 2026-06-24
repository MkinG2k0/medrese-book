import { notFound } from "next/navigation";

import { getStudentProfile } from "@/features/student-portal/actions/student-actions";
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
    </div>
  );
}
