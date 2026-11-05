export type AttributionPayment = {
	month: string
	amount: number
}

export function sumPaidForAttributionMonth(
	payments: AttributionPayment[],
	month: string,
): number {
	return payments
		.filter((payment) => payment.month === month)
		.reduce((sum, payment) => sum + payment.amount, 0)
}

/** Confirm must copy month from DB-loaded request, never from client body. */
export function paymentMonthFromRequest(requestMonth: string): string {
	return requestMonth
}
