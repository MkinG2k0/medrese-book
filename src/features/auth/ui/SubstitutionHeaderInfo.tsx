import { SwapOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

import type {
	SubstitutionHeaderKind,
	SubstitutionHeaderLine,
} from '@/features/auth/lib/get-substitution-header-info'

type SubstitutionHeaderInfoProps = {
	lines: SubstitutionHeaderLine[]
	variant?: 'banner' | 'inline'
}

const KIND_CONFIG: Record<
	SubstitutionHeaderKind,
	{ color: string; icon: typeof SwapOutlined; prefix: string }
> = {
	substituting: {
		color: 'gold',
		icon: SwapOutlined,
		prefix: 'Замещаете',
	},
	covered: {
		color: 'blue',
		icon: UserSwitchOutlined,
		prefix: 'Вас замещает',
	},
}

function SubstitutionTag({ line }: { line: SubstitutionHeaderLine }) {
	const config = KIND_CONFIG[line.kind]
	const Icon = config.icon

	return (
		<Tag color={config.color} className="m-0! inline-flex max-w-full items-center gap-1">
			<Icon className="shrink-0 text-xs" />
			<span className="truncate">
				{config.prefix} {line.teacherName} до {line.endDate}
			</span>
		</Tag>
	)
}

export function SubstitutionHeaderInfo({
	lines,
	variant = 'banner',
}: SubstitutionHeaderInfoProps) {
	if (lines.length === 0) return null

	const content = (
		<div className="flex flex-wrap gap-1">
			{lines.map((line) => (
				<SubstitutionTag key={line.id} line={line} />
			))}
		</div>
	)

	if (variant === 'inline') {
		return content
	}

	return (
		<div className="mr-auto hidden min-w-0 text-left sm:block">{content}</div>
	)
}
