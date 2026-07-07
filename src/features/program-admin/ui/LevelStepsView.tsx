'use client'

import { Breadcrumb, Button, Modal } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { EditLevelForm } from '@/features/program-admin/ui/EditLevelForm'
import { LevelStepsTable } from '@/features/program-admin/ui/LevelStepsTable'
import {
	programListPath,
	programStepNewPath,
} from '@/features/program-admin/lib/program-paths'
import Title from '@/shared/ui/Title'

type StepRow = {
	id: string
	order: number
	globalNumber: number
	title: string
	hours: number
}

type LevelStepsViewProps = {
	subjectId: string
	subjectName: string
	levelId: string
	levelNumber: number
	levelTitle: string
	steps: StepRow[]
}

export function LevelStepsView({
	subjectId,
	subjectName,
	levelId,
	levelNumber,
	levelTitle,
	steps,
}: LevelStepsViewProps) {
	const [showEdit, setShowEdit] = useState(false)
	const router = useRouter()

	return (
		<div className="flex flex-col gap-4">
			<Breadcrumb
				items={[
					{ title: <Link href="/admin/subjects">Предметы</Link> },
					{
						title: (
							<Link href={programListPath(subjectId)}>{subjectName}</Link>
						),
					},
					{ title: levelTitle },
				]}
			/>

			<div className="flex items-center justify-between">
				<Title level={3}>{levelTitle}</Title>
				<div className="flex gap-2">
					<Button onClick={() => setShowEdit(true)}>Редактировать уровень</Button>
					<Link href={programStepNewPath(subjectId, levelId)}>
						<Button type="primary">Новый шаг</Button>
					</Link>
				</div>
			</div>

			<LevelStepsTable subjectId={subjectId} levelId={levelId} steps={steps} />

			<Modal
				title="Редактировать уровень"
				open={showEdit}
				onCancel={() => setShowEdit(false)}
				footer={null}
				destroyOnHidden
			>
				<EditLevelForm
					key={`${levelId}-${levelNumber}-${levelTitle}`}
					subjectId={subjectId}
					levelId={levelId}
					initialNumber={levelNumber}
					initialTitle={levelTitle}
					onSuccess={() => {
						setShowEdit(false)
						router.refresh()
					}}
				/>
			</Modal>
		</div>
	)
}
