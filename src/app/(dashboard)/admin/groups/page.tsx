import Title from "@/shared/ui/Title";

import { getTeachersAndLevels } from "@/features/groups/actions/group-actions";
import { CreateGroupForm } from "@/features/groups/ui/CreateGroupForm";
import { requireRoles } from "@/shared/lib/session";

export default async function AdminGroupsPage() {
  await requireRoles(["MANAGER", "SUPER_ADMIN"]);
  const { teachers, levels } = await getTeachersAndLevels();

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Управление группами</Title>
      <CreateGroupForm
        teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
        levels={levels.map((l) => ({ id: l.id, title: l.title }))}
      />
    </div>
  );
}
