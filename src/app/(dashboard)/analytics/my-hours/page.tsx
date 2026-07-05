import { redirect } from 'next/navigation'

import { requireRole } from '@/shared/lib/session'

type MyTeacherHoursRedirectPageProps = {
	searchParams: Promise<{ from?: string; to?: string }>
}

export default async function MyTeacherHoursRedirectPage({
	searchParams,
}: MyTeacherHoursRedirectPageProps) {
	await requireRole('TEACHER')
	const { from, to } = await searchParams

	const params = new URLSearchParams()
	if (from) params.set('from', from)
	if (to) params.set('to', to)

	const query = params.toString()
	redirect(`/accounting/my-salary${query ? `?${query}` : ''}`)
}
