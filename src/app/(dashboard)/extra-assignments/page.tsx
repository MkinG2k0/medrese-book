import { ExtraAssignmentCatalogPage } from "@/features/extra-assignments";
import { getProgramStepsForExtraAssignments } from "@/features/extra-assignments/actions/extra-assignment-actions";
import { DEFAULT_QURAN_SUBJECT_ID } from "@/shared/lib/subject-constants";
import { requireRoles } from "@/shared/lib/session";

export default async function ExtraAssignmentsPage() {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);

  const programLevels = await getProgramStepsForExtraAssignments(
    DEFAULT_QURAN_SUBJECT_ID,
  );

  return <ExtraAssignmentCatalogPage programLevels={programLevels} />;
}
