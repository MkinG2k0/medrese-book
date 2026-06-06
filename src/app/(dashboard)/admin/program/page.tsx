import { Button } from "antd";
import Link from "next/link";

import { getLevels } from "@/features/program-admin/actions/program-actions";
import { LevelsTable } from "@/features/program-admin/ui/LevelsTable";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

export default async function ProgramPage() {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const levels = await getLevels();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Программа обучения</Title>
        <Link href="/admin/program/new">
          <Button type="primary">Новый уровень</Button>
        </Link>
      </div>
      <LevelsTable levels={levels} />
    </div>
  );
}
