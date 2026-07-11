import { notFound } from 'next/navigation'

import { getStudentProgressEdit } from '@/features/student-admin/actions/student-admin-actions'
import { StudentProgressForm } from '@/features/student-admin/ui/StudentProgressForm'
import { requireRoles } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type Props = { params: Promise<{ studentId: string }> }

export default async function StudentProgressEditPage({ params }: Props) {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])
	const { studentId } = await params
	const data = await getStudentProgressEdit(studentId)

	if (!data) notFound()

	return (
		<div className="flex flex-col gap-4">
			<Title level={3}>Прогресс ученика</Title>
			<Text type="secondary">
				Изменение уровня и текущего шага. Пройденные шаги до выбранного будут
				отмечены автоматически.
			</Text>

			<StudentProgressForm
				studentId={data.student.id}
				studentName={data.student.name}
				groupName={data.student.groupName}
				levels={data.levels}
				initial={{
					groupId: data.student.groupId,
					levelId: data.student.levelId,
					localStepIndex: data.student.localStepIndex,
				}}
				backHref={`/groups/${data.student.groupId}`}
			/>
		</div>
	)
}
