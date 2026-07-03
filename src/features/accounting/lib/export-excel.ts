import ExcelJS from 'exceljs'

import { formatMoney } from '@/shared/lib/money'

import {
	getPaymentMethodLabel,
	getSalaryStatusLabel,
} from './accounting-labels'
import type { LedgerEntry } from './query-operations-ledger'
import type { SalaryRow } from './query-salaries'
import type { StudentPaymentRow } from './query-student-payments'

function studentStatusLabel(
	status: StudentPaymentRow['status'],
): string {
	switch (status.kind) {
		case 'paid':
			return 'Оплачено'
		case 'partial':
			return 'Частично'
		case 'debt':
			return `Долг ${status.debtMonths} мес.`
		case 'advance':
			return 'Аванс'
	}
}

export async function buildPaymentsWorkbook(
	rows: StudentPaymentRow[],
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Платежи')
	sheet.columns = [
		{ header: 'Ученик', key: 'student', width: 24 },
		{ header: 'Группа', key: 'group', width: 20 },
		{ header: 'Тариф', key: 'rate', width: 14 },
		{ header: 'Оплачено за месяц', key: 'paid', width: 18 },
		{ header: 'Сальдо', key: 'balance', width: 14 },
		{ header: 'Статус', key: 'status', width: 16 },
	]
	for (const row of rows) {
		sheet.addRow({
			student: row.studentName,
			group: row.groupName,
			rate: formatMoney(row.tuitionRateKopecks),
			paid: formatMoney(row.monthPaidKopecks),
			balance: formatMoney(row.balanceKopecks),
			status: studentStatusLabel(row.status),
		})
	}
	return Buffer.from(await workbook.xlsx.writeBuffer())
}

export async function buildSalariesWorkbook(rows: SalaryRow[]): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Зарплаты')
	sheet.columns = [
		{ header: 'Учитель', key: 'teacher', width: 24 },
		{ header: 'Часы', key: 'hours', width: 14 },
		{ header: 'Ставка', key: 'rate', width: 14 },
		{ header: 'Начислено', key: 'amount', width: 14 },
		{ header: 'Статус', key: 'status', width: 16 },
		{ header: 'Аномалии', key: 'anomalies', width: 12 },
	]
	for (const row of rows) {
		sheet.addRow({
			teacher: row.teacherName,
			hours: row.hoursLabel,
			rate: formatMoney(row.hourlyRateKopecks ?? 0),
			amount: formatMoney(row.amountKopecks),
			status: getSalaryStatusLabel(row.status),
			anomalies: row.anomalyCount,
		})
	}
	return Buffer.from(await workbook.xlsx.writeBuffer())
}

export async function buildLedgerWorkbook(
	entries: LedgerEntry[],
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Журнал')
	sheet.columns = [
		{ header: 'Дата', key: 'date', width: 20 },
		{ header: 'Тип', key: 'type', width: 16 },
		{ header: 'Описание', key: 'label', width: 32 },
		{ header: 'Сумма', key: 'amount', width: 14 },
		{ header: 'Способ', key: 'method', width: 14 },
		{ header: 'Комментарий', key: 'comment', width: 24 },
		{ header: 'Автор', key: 'author', width: 18 },
	]
	for (const entry of entries) {
		sheet.addRow({
			date: new Date(entry.date).toLocaleString('ru-RU'),
			type: entry.type,
			label: entry.label,
			amount: formatMoney(entry.amountKopecks),
			method: entry.method ? getPaymentMethodLabel(entry.method as never) : '',
			comment: entry.comment ?? '',
			author: entry.createdBy ?? '',
		})
	}
	return Buffer.from(await workbook.xlsx.writeBuffer())
}
