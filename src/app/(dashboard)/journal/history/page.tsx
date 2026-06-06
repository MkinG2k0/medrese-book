import { getTeacherGroup } from '@/features/journal/actions/journal-actions'
import { JournalHistoryPage } from '@/features/journal/ui/JournalHistoryPage'
import { requireRole } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'

export default async function JournalHistoryRoutePage() {
	await requireRole('TEACHER')
	const group = await getTeacherGroup()

	if (!group) {
		return <Text>Группа не назначена</Text>
	}

	return <JournalHistoryPage groupId={group.id} />
}
