'use client'

import dynamic from 'next/dynamic'

const StepPdfDocument = dynamic(
	() => import('./StepPdfDocument').then((mod) => mod.StepPdfDocument),
	{
		ssr: false,
		loading: () => (
			<div className="h-[min(80vh,900px)] w-full rounded bg-white" />
		),
	},
)

type StepPdfViewerProps = {
	url: string
}

export function StepPdfViewer({ url }: StepPdfViewerProps) {
	return <StepPdfDocument url={url} />
}
