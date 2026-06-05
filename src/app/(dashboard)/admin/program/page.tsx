import { getLevels } from "@/features/program-admin/actions/program-actions";
import { LevelsTable } from "@/features/program-admin/ui/LevelsTable";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

export default async function ProgramPage() {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const levels = await getLevels();

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Программа обучения</Title>
      <LevelsTable levels={levels} />
    </div>
  );
}
