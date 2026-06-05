import { BlockRenderer } from '@/features/program-admin/ui/BlockRenderer'
import type { StepContent } from '@/shared/lib/validations/step'

export function LetterContent({ content }: { content: StepContent }) {
	return (
		<div>
			<BlockRenderer blocks={content.blocks} />
		</div>
	)
}
