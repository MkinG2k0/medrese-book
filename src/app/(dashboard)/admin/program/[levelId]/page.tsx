import { Button } from "antd";
import Link from "next/link";

import { getLevelSteps } from "@/features/program-admin/actions/program-actions";
import { LevelStepsTable } from "@/features/program-admin/ui/LevelStepsTable";
import {
  getStepOffsetForLevel,
  toGlobalStepNumber,
} from "@/shared/lib/student-progress";
import { requireRoles } from "@/shared/lib/session";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type Props = { params: Promise<{ levelId: string }> };

export default async function LevelStepsPage({ params }: Props) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const { levelId } = await params;
  const level = await getLevelSteps(levelId);

  if (!level) return <Text>Уровень не найден</Text>;

  const stepOffset = await getStepOffsetForLevel(level.number);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>{level.title}</Title>
        <div className="flex gap-2">
          <Link href={`/admin/program/${levelId}/edit`}>
            <Button>Редактировать уровень</Button>
          </Link>
          <Link href={`/admin/program/${levelId}/steps/new`}>
            <Button type="primary">Новый шаг</Button>
          </Link>
        </div>
      </div>
      <LevelStepsTable
        levelId={levelId}
        steps={level.steps.map((step) => ({
          ...step,
          globalNumber: toGlobalStepNumber(stepOffset, step.order),
        }))}
      />
    </div>
  );
}
