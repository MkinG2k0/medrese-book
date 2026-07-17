'use client'

import { StepContentPreview } from '@/features/program-admin/ui/StepContentPreview'
import { StepPdfViewer } from '@/features/program-admin/ui/StepPdfViewer'
import type { StepContent } from '@/shared/lib/validations/step'
import Text from '@/shared/ui/Text'

type LessonContentViewProps = {
	content: StepContent
	pdfUrl?: string | null
}

function hasVisibleBlocks(content: StepContent): boolean {
	return content.blocks.some((block) => {
		if (block.type === 'text' || block.type === 'arabic') {
			return block.value.trim().length > 0
		}
		if (block.type === 'image') return block.url.trim().length > 0
		if (block.type === 'list') {
			return block.items.some((item) => item.trim().length > 0)
		}
		return false
	})
}

export function LessonContentView({ content, pdfUrl }: LessonContentViewProps) {
	const hasPdf = Boolean(pdfUrl?.trim())
	const hasText = hasVisibleBlocks(content)

	if (!hasPdf && !hasText) {
		return <Text type="secondary">Нет содержания</Text>
	}

	return (
		<div className="flex w-full flex-col gap-4">
			{hasPdf && pdfUrl ? <StepPdfViewer url={pdfUrl} /> : null}
			{hasText ? <StepContentPreview content={content} /> : null}
		</div>
	)
}
