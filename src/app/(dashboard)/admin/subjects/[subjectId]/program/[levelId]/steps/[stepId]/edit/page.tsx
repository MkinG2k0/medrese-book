import { Breadcrumb, Button } from 'antd'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getStep } from '@/features/program-admin/actions/program-actions'
import {
	programLevelPath,
	programListPath,
} from '@/features/program-admin/lib/program-paths'
import { StepForm } from '@/features/program-admin/ui/StepForm'
import { requireRoles } from '@/shared/lib/session'
import Title from '@/shared/ui/Title'
import type { StepContent } from '@/shared/lib/validations/step'

type Props = {
	params: Promise<{ subjectId: string; levelId: string; stepId: string }>
}

export default async function EditSubjectStepPage({ params }: Props) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const { subjectId, levelId, stepId } = await params
	const step = await getStep(subjectId, levelId, stepId)

	if (!step) notFound()

	const levelHref = programLevelPath(subjectId, levelId)

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
			<Breadcrumb
				items={[
					{ title: <Link href="/admin/subjects">Предметы</Link> },
					{
						title: (
							<Link href={programListPath(subjectId)}>
								{step.level.subject.name}
							</Link>
						),
					},
					{
						title: <Link href={levelHref}>{step.level.title}</Link>,
					},
					{ title: `Редактирование: ${step.title}` },
				]}
			/>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Title level={3}>Редактирование: {step.title}</Title>
				<Link href={levelHref}>
					<Button>Назад к шагам уровня</Button>
				</Link>
			</div>
			<StepForm
				subjectId={subjectId}
				levelId={levelId}
				stepId={stepId}
				initial={{
					order: step.order,
					title: step.title,
					hours: step.hours,
					content: step.content as StepContent,
					teacherNote: step.teacherNote as StepContent,
					pdfUrl: step.pdfUrl,
				}}
			/>
		</div>
	)
}
