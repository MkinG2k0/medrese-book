'use client'

import { CheckOutlined, SwapOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { useTransition } from 'react'

import type { SwitchableUser } from '@/features/auth/actions/switch-user-actions'
import { getDisplayRoleLabel } from '@/features/auth/lib/role-labels'
import { switchUser } from '@/features/auth/actions/switch-user-actions'
import Text from '@/shared/ui/Text'

function getInitials(name: string) {
	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()
}

type UserSwitcherProps = {
	users: SwitchableUser[]
	currentUserId: string
	currentUserName: string
	substituteOwnerUserId: string
	collapsed?: boolean
}

export function UserSwitcher({
	users,
	currentUserId,
	currentUserName,
	substituteOwnerUserId,
	collapsed = false,
}: UserSwitcherProps) {
	const [isPending, startTransition] = useTransition()

	const items: MenuProps['items'] = users.map((user) => ({
		key: user.id,
		label: (
			<div className="flex min-w-48 items-center justify-between gap-3">
				<div className="flex flex-col">
					<Text>{user.name}</Text>
					<Text type="secondary">
						{getDisplayRoleLabel(user.role, {
							isSubstitutionTarget:
								user.role === 'TEACHER' &&
								user.id !== substituteOwnerUserId,
						})}
					</Text>
				</div>
				{user.id === currentUserId && <CheckOutlined />}
			</div>
		),
		disabled: user.id === currentUserId,
	}))

	const handleSelect: MenuProps['onClick'] = ({ key }) => {
		startTransition(async () => {
			await switchUser(key)
		})
	}

	return (
		<Dropdown
			menu={{ items, onClick: handleSelect }}
			trigger={['click']}
			disabled={isPending}
		>
			<button
				type="button"
				className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-white/5"
			>
				<Avatar size="small">{getInitials(currentUserName)}</Avatar>
				{!collapsed && (
					<div className="min-w-0 flex-1">
						<Text className="block truncate">{currentUserName}</Text>
					</div>
				)}
				{isPending ? (
					<Spin size="small" />
				) : (
					!collapsed && <SwapOutlined className="shrink-0 opacity-60" />
				)}
			</button>
		</Dropdown>
	)
}
