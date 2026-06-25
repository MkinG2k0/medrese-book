import { success } from '@/shared/api'
import { getVapidPublicKey } from '@/shared/lib/push/vapid'

export async function GET() {
	const publicKey = getVapidPublicKey()
	if (!publicKey) {
		return success({ publicKey: null })
	}
	return success({ publicKey })
}
