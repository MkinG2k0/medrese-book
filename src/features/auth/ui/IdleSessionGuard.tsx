'use client'

import { useIdleTimer } from 'react-idle-timer'

import type { UserRole } from '@/entities/user'
import {
	isTeacherIdleLogoutEnabled,
	TEACHER_IDLE_LOGOUT_CALLBACK,
	TEACHER_IDLE_TIMEOUT_MS,
} from '@/features/auth/lib/idle-session'
import { signOutWithLessonCleanup } from '@/features/auth/lib/sign-out'

type IdleSessionGuardProps = {
	role: UserRole
	userId: string
}

export function IdleSessionGuard({ role, userId }: IdleSessionGuardProps) {
	const enabled = isTeacherIdleLogoutEnabled(role)

	useIdleTimer({
		timeout: TEACHER_IDLE_TIMEOUT_MS,
		disabled: !enabled,
		debounce: 500,
		crossTab: true,
		events: ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'],
		onIdle: () => {
			void signOutWithLessonCleanup({
				callbackUrl: TEACHER_IDLE_LOGOUT_CALLBACK,
				role,
				userId,
			})
		},
	})

	return null
}
