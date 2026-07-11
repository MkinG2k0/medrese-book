import { getTeacherGroups } from '@/features/journal/actions/journal-actions'
import { JournalHistoryPage } from '@/features/journal/ui/JournalHistoryPage'
import { requireRole } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'

export default async function JournalHistoryRoutePage() {
	await requireRole('TEACHER')
	const groups = await getTeacherGroups()

	if (groups.length === 0) {
		return <Text>Группа не назначена</Text>
	}

	return (
		<JournalHistoryPage groups={groups} defaultGroupId={groups[0]!.id} />
	)
}
