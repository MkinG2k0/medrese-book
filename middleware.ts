import NextAuth from 'next-auth'

import { authConfig } from '@/shared/lib/auth.config'

export default NextAuth(authConfig).auth

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|robots.txt|icons|uploads|api/auth).*)',
	],
}
