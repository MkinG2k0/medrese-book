import { toMonthKey } from '@/shared/lib/accounting/month'
import { prisma } from '@/shared/lib/prisma'

import {
	MonthClosedError,
	assertMonthOpenForKey,
} from './month-close-rules'

export { MonthClosedError, assertMonthOpenForKey } from './month-close-rules'

export async function assertMonthOpenForDate(date: Date): Promise<void> {
	const month = toMonthKey(date)
	const closed = await prisma.monthClose.findUnique({ where: { month } })
	if (closed) throw new MonthClosedError(month)
}
