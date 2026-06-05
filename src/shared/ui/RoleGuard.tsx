'use client'

import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'

import type { UserRole } from '@/entities/user'

type RoleGuardProps = {
	roles: UserRole[]
	children: ReactNode
	fallback?: ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
	const { data: session } = useSession()

	if (!session || !roles.includes(session.user.role)) {
		return <>{fallback}</>
	}

	return <>{children}</>
}
