import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { buildPaymentsWorkbook } from './export-excel'
import type { StudentPaymentRow } from './query-student-payments'

const sampleRow = {
	studentId: 's1',
	studentName: 'Али',
	groupName: 'Группа Аль-Фатиха',
	tuitionRateKopecks: 500000,
	discountReason: null,
	monthPaidKopecks: 500000,
	monthChargeKopecks: 500000,
	balanceKopecks: 0,
	status: { kind: 'paid' },
} satisfies StudentPaymentRow

async function loadPaymentsSheet(
	buffer: Buffer,
): Promise<ExcelJS.Worksheet> {
	const workbook = new ExcelJS.Workbook()
	// ExcelJS typings predate Node 22 generic Buffer — bridge via never.
	await workbook.xlsx.load(buffer as never)
	const sheet = workbook.getWorksheet('Платежи')
	expect(sheet).toBeDefined()
	return sheet!
}

function headerValues(sheet: ExcelJS.Worksheet): string[] {
	const headers: string[] = []
	sheet.getRow(1).eachCell((cell) => {
		headers.push(String(cell.value ?? ''))
	})
	return headers
}

describe('buildPaymentsWorkbook', () => {
	it('does not include Сальдо column and keeps Статус', async () => {
		const buffer = await buildPaymentsWorkbook([sampleRow])
		const sheet = await loadPaymentsSheet(buffer)
		const headers = headerValues(sheet)

		expect(headers).not.toContain('Сальдо')
		expect(headers).toContain('Статус')
		expect(headers).not.toContain('balance')

		const statusCol = headers.indexOf('Статус') + 1
		expect(sheet.getRow(2).getCell(statusCol).value).toBe('Оплачено')
		expect(headers).toHaveLength(5)
	})
})
