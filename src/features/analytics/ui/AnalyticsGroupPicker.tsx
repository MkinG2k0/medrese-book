'use client'

import { Select } from 'antd'
import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { AnalyticsGroupOption } from '@/features/analytics/actions/analytics-actions'
import {
	ALL_GROUPS,
	ALL_TEACHERS,
	buildAnalyticsSearchParams,
} from '@/features/analytics/lib/analytics-query'

type AnalyticsGroupPickerProps = {
	groups: AnalyticsGroupOption[]
	selectedTeacher: string
	selectedGroupId: string | null
	month: string
	selectedSubjectId: string
}

export function AnalyticsGroupPicker({
	groups,
	selectedTeacher,
	selectedGroupId,
	month,
	selectedSubjectId,
}: AnalyticsGroupPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const groupOptions = useMemo(
		() => [
			{ value: ALL_GROUPS, label: 'Все группы' },
			...groups.map((group) => ({
				value: group.id,
				label: `${group.name} — ${group.subjectName}`,
			})),
		],
		[groups],
	)

	const isAllTeachers = selectedTeacher === ALL_TEACHERS

	return (
		<Select
			value={selectedGroupId ?? undefined}
			options={groupOptions}
			onChange={(groupId) => {
				const nextMonth = searchParams.get('month') ?? month
				const teacher = searchParams.get('teacher') ?? selectedTeacher
				const subjectId =
					searchParams.get('subjectId') ?? selectedSubjectId
				router.push(
					`${pathname}${buildAnalyticsSearchParams({
						month: nextMonth,
						teacher,
						groupId,
						subjectId,
					})}`,
				)
			}}
			className="w-full sm:w-56"
			disabled={isAllTeachers || groups.length === 0}
			placeholder="Группа"
			aria-label="Группа"
		/>
	)
}
