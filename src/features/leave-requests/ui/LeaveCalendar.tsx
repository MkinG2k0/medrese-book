'use client'

import { Calendar, Spin } from 'antd'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import {
	getLeaveRequestStatusLabel,
	getLeaveRequestTypeLabel,
} from '@/features/leave-requests/lib/leave-labels'
import Text from '@/shared/ui/Text'

type LeaveCalendarMode = 'teacher' | 'manager'

type LeaveCalendarProps = {
	requests: LeaveRequestListItem[]
	loading?: boolean
	mode?: LeaveCalendarMode
	onDateClick: (request: LeaveRequestListItem) => void
}

function expandRequestsByDay(requests: LeaveRequestListItem[]) {
	const map = new Map<string, LeaveRequestListItem[]>()

	for (const request of requests) {
		if (request.status === 'REJECTED') continue

		const days = eachDayOfInterval({
			start: parseISO(request.startDate),
			end: parseISO(request.endDate),
		})

		for (const day of days) {
			const key = format(day, 'yyyy-MM-dd')
			const existing = map.get(key) ?? []
			existing.push(request)
			map.set(key, existing)
		}
	}

	return map
}

function getBadgeClassName(status: LeaveRequestListItem['status']) {
	if (status === 'APPROVED') {
		return 'bg-green-700/50 text-green-200'
	}
	return 'bg-neutral-600/40 text-neutral-300'
}

function abbreviateTeacherSurname(fullName: string) {
	const parts = fullName.trim().split(/\s+/)
	const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0]
	if (surname.length <= 4) return surname
	return `${surname.slice(0, 3)}.`
}

function getCellLabel(
	request: LeaveRequestListItem,
	mode: LeaveCalendarMode,
) {
	if (mode === 'manager') {
		return abbreviateTeacherSurname(request.teacherName)
	}
	return `${getLeaveRequestTypeLabel(request.type)} · ${getLeaveRequestStatusLabel(request.status)}`
}

export function LeaveCalendar({
	requests,
	loading = false,
	mode = 'teacher',
	onDateClick,
}: LeaveCalendarProps) {
	const requestsByDay = useMemo(
		() => expandRequestsByDay(requests),
		[requests],
	)

	const visibleRequestCount = useMemo(() => {
		const ids = new Set<string>()
		for (const request of requests) {
			if (request.status !== 'REJECTED') {
				ids.add(request.id)
			}
		}
		return ids.size
	}, [requests])

	if (loading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<Spin size="large" />
			</div>
		)
	}

	if (visibleRequestCount === 0) {
		const emptyHeading =
			mode === 'manager' ? 'Нет заявок в этом месяце' : 'Заявок пока нет'
		const emptyBody =
			mode === 'manager'
				? 'Новые заявки отображаются серым; после подтверждения — зелёным.'
				: 'Создайте отпуск, отгул или больничный — заявка появится здесь после отправки.'

		return (
			<div className="flex flex-col gap-2 py-8 text-center">
				<Text strong className="text-base">
					{emptyHeading}
				</Text>
				<Text type="secondary">{emptyBody}</Text>
			</div>
		)
	}

	const cellRender = (current: Dayjs, info: { type: string }) => {
		if (info.type !== 'date') return null

		const dayKey = current.format('YYYY-MM-DD')
		const dayRequests = requestsByDay.get(dayKey)
		if (!dayRequests?.length) return null

		const visible = dayRequests.slice(0, 3)
		const overflow = dayRequests.length - visible.length

		return (
			<div className="flex flex-col gap-0.5 pt-1">
				{visible.map((request) => (
					<button
						key={`${request.id}-${dayKey}`}
						type="button"
						className={`block w-full truncate rounded px-1 py-0.5 text-left text-xs ${getBadgeClassName(request.status)}`}
						onClick={(event) => {
							event.stopPropagation()
							onDateClick(request)
						}}
					>
						{getCellLabel(request, mode)}
					</button>
				))}
				{overflow > 0 && (
					<span className="px-1 text-xs text-neutral-400">+{overflow}</span>
				)}
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<Calendar
				fullscreen={false}
				cellRender={(current, info) =>
					cellRender(current as Dayjs, info)
				}
				onSelect={(date) => {
					const dayKey = (date as Dayjs).format('YYYY-MM-DD')
					const dayRequests = requestsByDay.get(dayKey)
					if (dayRequests?.[0]) {
						onDateClick(dayRequests[0])
					}
				}}
			/>
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="inline-block h-3 w-3 rounded bg-neutral-600/40" />
					<Text type="secondary">Создана</Text>
				</div>
				<div className="flex items-center gap-2">
					<span className="inline-block h-3 w-3 rounded bg-green-700/50" />
					<Text type="secondary">Подтверждена</Text>
				</div>
			</div>
		</div>
	)
}
