import dayjs from 'dayjs'

import { prisma } from '@/shared/lib/prisma'
import {
	getActiveSubstitutionsForAbsentTeacher,
	getActiveSubstitutionsForSubstitute,
	getSubstitutableTeacherUserIds,
} from '@/shared/lib/substitution-access'

export type SubstitutionHeaderKind = 'substituting' | 'covered'

export type SubstitutionHeaderLine = {
	id: string
	kind: SubstitutionHeaderKind
	teacherName: string
	endDate: string
}

function formatEndDate(endDate: Date): string {
	return dayjs(endDate).format('DD.MM.YYYY')
}

function dedupeByTeacherAndKind(
	lines: SubstitutionHeaderLine[],
): SubstitutionHeaderLine[] {
	const byKey = new Map<string, SubstitutionHeaderLine>()

	for (const line of lines) {
		const key = `${line.kind}:${line.teacherName}`
		const existing = byKey.get(key)
		if (!existing || dayjs(line.endDate, 'DD.MM.YYYY').isAfter(dayjs(existing.endDate, 'DD.MM.YYYY'))) {
			byKey.set(key, line)
		}
	}

	return [...byKey.values()]
}

type SessionForSubstitutionHeader = {
	user: {
		id: string
		role: string
		teacherId: string | null
		switchOwnerId?: string | null
	}
}

export async function getSubstitutionHeaderInfo(
	session: SessionForSubstitutionHeader,
): Promise<SubstitutionHeaderLine[]> {
	if (session.user.role !== 'TEACHER' || !session.user.teacherId) {
		return []
	}

	const lines: SubstitutionHeaderLine[] = []

	if (session.user.switchOwnerId) {
		const absentTeacher = await prisma.teacher.findFirst({
			where: { userId: session.user.id },
			select: { id: true },
		})
		const owner = await prisma.user.findUnique({
			where: { id: session.user.switchOwnerId },
			select: { teacher: { select: { id: true } } },
		})

		if (absentTeacher && owner?.teacher?.id) {
			const active = await getActiveSubstitutionsForSubstitute(
				owner.teacher.id,
			)
			for (const substitution of active) {
				if (substitution.absentTeacherId !== absentTeacher.id) continue
				lines.push({
					id: substitution.id,
					kind: 'substituting',
					teacherName: substitution.absentTeacher.user.name,
					endDate: formatEndDate(substitution.endDate),
				})
			}
		}

		return dedupeByTeacherAndKind(lines)
	}

	const covered = await getActiveSubstitutionsForAbsentTeacher(
		session.user.teacherId,
	)
	for (const substitution of covered) {
		lines.push({
			id: substitution.id,
			kind: 'covered',
			teacherName: substitution.substituteTeacher.user.name,
			endDate: formatEndDate(substitution.endDate),
		})
	}

	const substituting = await getActiveSubstitutionsForSubstitute(
		session.user.teacherId,
	)
	for (const substitution of substituting) {
		lines.push({
			id: substitution.id,
			kind: 'substituting',
			teacherName: substitution.absentTeacher.user.name,
			endDate: formatEndDate(substitution.endDate),
		})
	}

	return dedupeByTeacherAndKind(lines)
}

export async function isTeacherActivelySubstituting(
	session: SessionForSubstitutionHeader,
): Promise<boolean> {
	if (
		session.user.role !== 'TEACHER' ||
		!session.user.switchOwnerId ||
		!session.user.teacherId
	) {
		return false
	}

	const owner = await prisma.user.findUnique({
		where: { id: session.user.switchOwnerId },
		select: { role: true, teacher: { select: { id: true } } },
	})

	if (owner?.role !== 'TEACHER' || !owner.teacher?.id) {
		return false
	}

	const active = await getActiveSubstitutionsForSubstitute(owner.teacher.id)
	return active.some(
		(substitution) => substitution.absentTeacherId === session.user.teacherId,
	)
}

export async function getSubstitutionTargetUserIds(
	session: SessionForSubstitutionHeader,
): Promise<string[]> {
	if (session.user.role !== 'TEACHER') {
		return []
	}

	let substituteTeacherId = session.user.teacherId

	if (session.user.switchOwnerId) {
		const owner = await prisma.user.findUnique({
			where: { id: session.user.switchOwnerId },
			select: { teacher: { select: { id: true } } },
		})
		substituteTeacherId = owner?.teacher?.id ?? null
	}

	if (!substituteTeacherId) {
		return []
	}

	return getSubstitutableTeacherUserIds(substituteTeacherId)
}
