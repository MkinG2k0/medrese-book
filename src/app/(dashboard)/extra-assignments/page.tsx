import { ExtraAssignmentCatalogPage } from "@/features/extra-assignments";
import { getProgramStepsForExtraAssignments } from "@/features/extra-assignments/actions/extra-assignment-actions";
import { requireRoles } from "@/shared/lib/session";

export default async function ExtraAssignmentsPage() {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);

  const programLevels = await getProgramStepsForExtraAssignments();

  return <ExtraAssignmentCatalogPage programLevels={programLevels} />;
}
