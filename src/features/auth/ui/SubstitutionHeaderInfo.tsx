import type { SubstitutionHeaderLine } from '@/features/auth/lib/get-substitution-header-info'
import Text from '@/shared/ui/Text'

type SubstitutionHeaderInfoProps = {
	lines: SubstitutionHeaderLine[]
	variant?: 'banner' | 'inline'
}

export function SubstitutionHeaderInfo({
	lines,
	variant = 'banner',
}: SubstitutionHeaderInfoProps) {
	if (lines.length === 0) return null

	if (variant === 'inline') {
		return (
			<>
				{lines.map((line) => (
					<Text key={line.text} type="secondary" className="block">
						{line.text}
					</Text>
				))}
			</>
		)
	}

	return (
		<div className="mr-auto hidden text-left sm:block">
			{lines.map((line) => (
				<Text key={line.text} type="secondary" className="block">
					{line.text}
				</Text>
			))}
		</div>
	)
}
