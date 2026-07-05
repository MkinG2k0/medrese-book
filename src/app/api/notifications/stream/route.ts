import { unauthorized } from '@/shared/api'
import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
	const session = await auth()
	if (!session?.user) return unauthorized()

	const userId = session.user.id
	const encoder = new TextEncoder()
	let lastSeen = new Date()

	const stream = new ReadableStream({
		start(controller) {
			const poll = async () => {
				const rows = await prisma.notification.findMany({
					where: { userId, createdAt: { gt: lastSeen } },
					orderBy: { createdAt: 'asc' },
					take: 20,
				})
				for (const row of rows) {
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({
								type: 'notification',
								id: row.id,
								title: row.title,
								body: row.body,
								link: row.link,
							})}\n\n`,
						),
					)
					if (row.createdAt > lastSeen) {
						lastSeen = row.createdAt
					}
				}
			}

			const pollId = setInterval(() => void poll(), 2000)
			const heartbeatId = setInterval(() => {
				controller.enqueue(encoder.encode(': heartbeat\n\n'))
			}, 30000)

			request.signal.addEventListener('abort', () => {
				clearInterval(pollId)
				clearInterval(heartbeatId)
				controller.close()
			})

			void poll()
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		},
	})
}
