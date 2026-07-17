'use client'

type StepPdfViewerProps = {
	url: string
}

/** Параметры фрагмента Chromium PDF viewer: скрыть панель миниатюр, зум 75%. */
function pdfEmbedUrl(url: string): string {
	const hashIndex = url.indexOf('#')
	const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url
	const existingHash = hashIndex >= 0 ? url.slice(hashIndex + 1) : ''

	const params = new Map<string, string>()
	for (const part of existingHash.split('&')) {
		if (!part) continue
		const eq = part.indexOf('=')
		if (eq < 0) {
			params.set(part, '')
			continue
		}
		params.set(part.slice(0, eq), part.slice(eq + 1))
	}

	params.set('navpanes', '0')
	if (!params.has('zoom')) {
		params.set('zoom', '75')
	}

	const fragment = [...params.entries()]
		.map(([key, value]) => (value === '' ? key : `${key}=${value}`))
		.join('&')

	return `${base}#${fragment}`
}

export function StepPdfViewer({ url }: StepPdfViewerProps) {
	const embedUrl = pdfEmbedUrl(url)

	return (
		<div className="flex w-full flex-col gap-2">
			<iframe
				src={embedUrl}
				title="PDF"
				className="h-[min(80vh,900px)] w-full rounded border-0 bg-[#1a1816]"
			/>
			<a href={url} target="_blank" rel="noopener noreferrer">
				Открыть PDF
			</a>
		</div>
	)
}
