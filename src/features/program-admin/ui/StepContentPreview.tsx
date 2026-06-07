'use client'

import { BlockRenderer } from '@/features/program-admin/ui/BlockRenderer'
import '@/features/program-admin/ui/editor/step-editor.css'
import type { StepContent } from '@/shared/lib/validations/step'

type StepContentPreviewProps = {
	content: StepContent
}

export function StepContentPreview({ content }: StepContentPreviewProps) {
	return (
		<div className="step-editor">
			<div className="step-content-preview">
				<BlockRenderer blocks={content.blocks} />
			</div>
		</div>
	)
}
