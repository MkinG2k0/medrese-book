'use client'

import { signOut } from 'next-auth/react'
import { useIdleTimer } from 'react-idle-timer'

import type { UserRole } from '@/entities/user'
import {
	isTeacherIdleLogoutEnabled,
	TEACHER_IDLE_LOGOUT_CALLBACK,
	TEACHER_IDLE_TIMEOUT_MS,
} from '@/features/auth/lib/idle-session'

type IdleSessionGuardProps = {
	role: UserRole
}

export function IdleSessionGuard({ role }: IdleSessionGuardProps) {
	const enabled = isTeacherIdleLogoutEnabled(role)

	useIdleTimer({
		timeout: TEACHER_IDLE_TIMEOUT_MS,
		disabled: !enabled,
		debounce: 500,
		crossTab: true,
		events: ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'],
		onIdle: () => {
			void signOut({ callbackUrl: TEACHER_IDLE_LOGOUT_CALLBACK })
		},
	})

	return null
}
