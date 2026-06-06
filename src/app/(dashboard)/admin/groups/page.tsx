import Title from "@/shared/ui/Title";

import { getTeachers } from "@/features/groups/actions/group-actions";
import { CreateGroupForm } from "@/features/groups/ui/CreateGroupForm";
import { requireRoles } from "@/shared/lib/session";

export default async function AdminGroupsPage() {
  await requireRoles(["MANAGER", "SUPER_ADMIN"]);
  const teachers = await getTeachers();

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Управление группами</Title>
      <CreateGroupForm
        teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
      />
    </div>
  );
}
