import { ExtraAssignmentCatalogPage } from "@/features/extra-assignments";
import {
  getExtraAssignmentSubjects,
  getProgramStepsForExtraAssignments,
} from "@/features/extra-assignments/actions/extra-assignment-actions";
import { DEFAULT_QURAN_SUBJECT_ID } from "@/shared/lib/subject-constants";
import { requireRoles } from "@/shared/lib/session";

export default async function ExtraAssignmentsPage() {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);

  const subjects = await getExtraAssignmentSubjects();
  const defaultSubjectId =
    subjects.find((subject) => subject.id === DEFAULT_QURAN_SUBJECT_ID)?.id ??
    subjects[0]?.id ??
    DEFAULT_QURAN_SUBJECT_ID;
  const programLevels =
    await getProgramStepsForExtraAssignments(defaultSubjectId);

  return (
    <ExtraAssignmentCatalogPage
      subjects={subjects}
      initialSubjectId={defaultSubjectId}
      initialProgramLevels={programLevels}
    />
  );
}
