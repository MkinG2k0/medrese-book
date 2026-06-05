type ProgressBarProps = {
	current: number
	total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
	const percent = total > 0 ? Math.round((current / total) * 100) : 0

	return (
		<div className="h-2 w-full overflow-hidden rounded-full bg-[#2a2622]">
			<div
				className="h-full rounded-full bg-[#c9a84c] transition-all"
				style={{ width: `${percent}%` }}
			/>
		</div>
	)
}
