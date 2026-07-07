'use client'

import { Button, Modal } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CreateLevelForm } from '@/features/program-admin/ui/CreateLevelForm'
import { LevelsTable } from '@/features/program-admin/ui/LevelsTable'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type LevelRow = {
	id: string
	number: number
	title: string
	_count: { steps: number }
}

type ProgramSubjectViewProps = {
	subjectId: string
	subjectName: string
	levels: LevelRow[]
}

export function ProgramSubjectView({
	subjectId,
	subjectName,
	levels,
}: ProgramSubjectViewProps) {
	const [showCreate, setShowCreate] = useState(false)
	const router = useRouter()

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Title level={3}>{subjectName}</Title>
				<Button type="primary" onClick={() => setShowCreate(true)}>
					Новый уровень
				</Button>
			</div>

			{levels.length === 0 && (
				<div className="flex flex-col gap-2">
					<Text strong>Программа пока пуста</Text>
					<Text type="secondary">
						Добавьте первый уровень, чтобы настроить шаги обучения.
					</Text>
				</div>
			)}

			<LevelsTable subjectId={subjectId} levels={levels} />

			<Modal
				title="Новый уровень"
				open={showCreate}
				onCancel={() => setShowCreate(false)}
				footer={null}
				destroyOnHidden
			>
				<CreateLevelForm
					subjectId={subjectId}
					onSuccess={() => {
						setShowCreate(false)
						router.refresh()
					}}
				/>
			</Modal>
		</div>
	)
}
