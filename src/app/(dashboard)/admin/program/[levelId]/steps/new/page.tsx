import { StepForm } from "@/features/program-admin/ui/StepForm";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

type Props = { params: Promise<{ levelId: string }> };

export default async function NewStepPage({ params }: Props) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const { levelId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Новый шаг</Title>
      <StepForm levelId={levelId} />
    </div>
  );
}
