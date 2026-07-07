import { notFound } from 'next/navigation'

import { getStep } from '@/features/program-admin/actions/program-actions'
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
	const step = await getStep(stepId)

	if (!step) notFound()

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
			<Title level={3}>Редактирование: {step.title}</Title>
			<StepForm
				subjectId={subjectId}
				levelId={levelId}
				stepId={stepId}
				initial={{
					order: step.order,
					title: step.title,
					hours: step.hours,
					content: step.content as StepContent,
					description: step.description,
				}}
			/>
		</div>
	)
}
