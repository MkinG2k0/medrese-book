'use client'

type StepPdfViewerProps = {
	url: string
}

export function StepPdfViewer({ url }: StepPdfViewerProps) {
	return (
		<div className="flex w-full flex-col gap-2">
			<iframe
				src={url}
				title="PDF"
				className="h-[560px] w-full rounded border-0"
			/>
			<a href={url} target="_blank" rel="noopener noreferrer">
				Открыть PDF
			</a>
		</div>
	)
}
