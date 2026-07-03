import { unauthorized } from '@/shared/api'

export function verifyCronSecret(request: Request): Response | null {
	const secret = process.env.CRON_SECRET
	if (!secret) {
		return new Response(
			JSON.stringify({ data: null, error: 'CRON_SECRET не настроен' }),
			{ status: 503, headers: { 'Content-Type': 'application/json' } },
		)
	}

	const authHeader = request.headers.get('authorization')
	if (authHeader !== `Bearer ${secret}`) {
		return unauthorized()
	}

	return null
}
