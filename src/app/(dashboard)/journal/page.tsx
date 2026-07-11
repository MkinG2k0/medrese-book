import { Suspense } from 'react'

import { getTeacherGroups } from '@/features/journal/actions/journal-actions'
import { StudentList } from '@/features/journal/ui/StudentList'
import { requireRole } from '@/shared/lib/session'
import { PageLoader } from '@/shared/ui/PageLoader'
import Text from '@/shared/ui/Text'

export default async function JournalPage() {
	await requireRole('TEACHER')
	const groups = await getTeacherGroups()

	if (groups.length === 0) {
		return <Text>Группа не назначена</Text>
	}

	return (
		<Suspense fallback={<PageLoader size="lg" />}>
			<StudentList groups={groups} defaultGroupId={groups[0].id} />
		</Suspense>
	)
}
