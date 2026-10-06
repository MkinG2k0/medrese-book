'use client'

import {
	DownloadOutlined,
	LeftOutlined,
	RightOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Spin } from 'antd'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'

import {
	clampPdfZoom,
	isCrossOriginPdfUrl,
	pdfFileName,
	pdfSourceUrl,
	PDF_ZOOM_DEFAULT,
	PDF_ZOOM_STEP,
} from '@/features/program-admin/lib/pdf-source-url'
import '@/features/program-admin/ui/editor/step-editor.css'

function ensurePdfWorker() {
	if (GlobalWorkerOptions.workerSrc) return
	// Same-origin public file — `import.meta.url` worker path 404s in prod webpack/standalone.
	GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

type StepPdfDocumentProps = {
	url: string
}

function PdfPage({
	pdf,
	pageNumber,
	width,
}: {
	pdf: PDFDocumentProxy
	pageNumber: number
	width: number
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (width <= 0) return
		const canvas = canvasRef.current
		if (!canvas) return

		let cancelled = false
		let renderTask: RenderTask | null = null

		void (async () => {
			const page = await pdf.getPage(pageNumber)
			if (cancelled) {
				page.cleanup()
				return
			}

			const unscaled = page.getViewport({ scale: 1 })
			const scale = width / unscaled.width
			const viewport = page.getViewport({ scale })
			const dpr = window.devicePixelRatio || 1

			const offscreen = document.createElement('canvas')
			offscreen.width = Math.floor(viewport.width * dpr)
			offscreen.height = Math.floor(viewport.height * dpr)
			const offscreenCtx = offscreen.getContext('2d')
			if (!offscreenCtx) {
				page.cleanup()
				return
			}

			renderTask = page.render({
				canvas: offscreen,
				viewport,
				canvasContext: offscreenCtx,
				transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
			})
			try {
				await renderTask.promise
			} catch {
				page.cleanup()
				return
			}
			if (cancelled) {
				page.cleanup()
				return
			}

			const ctx = canvas.getContext('2d')
			if (!ctx) {
				page.cleanup()
				return
			}

			canvas.width = offscreen.width
			canvas.height = offscreen.height
			canvas.style.width = `${Math.floor(viewport.width)}px`
			canvas.style.height = `${Math.floor(viewport.height)}px`
			ctx.drawImage(offscreen, 0, 0)
			page.cleanup()
		})()

		return () => {
			cancelled = true
			renderTask?.cancel()
		}
	}, [pdf, pageNumber, width])

	return <canvas ref={canvasRef} className="block bg-white" />
}

export function StepPdfDocument({ url }: StepPdfDocumentProps) {
	const source = pdfSourceUrl(url)
	const fileName = pdfFileName(source)
	const rootRef = useRef<HTMLDivElement>(null)
	const [width, setWidth] = useState(0)
	const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
	const [pageCount, setPageCount] = useState(0)
	const [pageNumber, setPageNumber] = useState(1)
	const [zoom, setZoom] = useState(PDF_ZOOM_DEFAULT)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const el = rootRef.current
		if (!el) return

		const updateWidth = () => {
			const nextWidth = Math.floor(el.clientWidth)
			if (nextWidth <= 0) return
			setWidth((current) => (Math.abs(current - nextWidth) < 8 ? current : nextWidth))
		}

		updateWidth()
		const observer = new ResizeObserver(updateWidth)
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		setError(null)
		setPdf(null)
		setPageCount(0)
		setPageNumber(1)

		ensurePdfWorker()
		const crossOrigin = isCrossOriginPdfUrl(source, window.location.origin)
		const loadingTask = getDocument({
			url: source,
			withCredentials: false,
			disableRange: crossOrigin,
			disableStream: crossOrigin,
		})
		void loadingTask.promise
			.then((doc) => {
				if (cancelled) {
					return
				}
				setPdf(doc)
				setPageCount(doc.numPages)
				setLoading(false)
			})
			.catch(() => {
				if (!cancelled) {
					setError('Не удалось показать PDF')
					setLoading(false)
				}
			})

		return () => {
			cancelled = true
			void loadingTask.destroy()
		}
	}, [source])

	const renderWidth = width > 0 ? Math.floor((width * zoom) / 100) : 0
	const canPrev = pageNumber > 1
	const canNext = pageNumber < pageCount

	return (
		<div ref={rootRef} className="step-editor">
			<div className="step-editor-toolbar">
				<span className="min-w-0 flex-1 truncate">{fileName}</span>
				<Button
					type="text"
					size="small"
					icon={<LeftOutlined />}
					disabled={!canPrev}
					aria-label="Предыдущая страница"
					onClick={() => setPageNumber((page) => page - 1)}
				/>
				<span>
					{pageNumber} / {pageCount || '—'}
				</span>
				<Button
					type="text"
					size="small"
					icon={<RightOutlined />}
					disabled={!canNext}
					aria-label="Следующая страница"
					onClick={() => setPageNumber((page) => page + 1)}
				/>
				<Button
					type="text"
					size="small"
					icon={<ZoomOutOutlined />}
					aria-label="Уменьшить"
					onClick={() => setZoom((value) => clampPdfZoom(value - PDF_ZOOM_STEP))}
				/>
				<span>{zoom}%</span>
				<Button
					type="text"
					size="small"
					icon={<ZoomInOutlined />}
					aria-label="Увеличить"
					onClick={() => setZoom((value) => clampPdfZoom(value + PDF_ZOOM_STEP))}
				/>
				<Button
					type="text"
					size="small"
					icon={<DownloadOutlined />}
					href={source}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Открыть PDF"
				/>
			</div>
			<div className="relative h-[min(80vh,900px)] w-full overflow-x-auto overflow-y-scroll bg-white [scrollbar-gutter:stable]">
				{(loading && !pdf) || (!error && pdf && renderWidth <= 0) ? (
					<div className="flex h-full items-center justify-center">
						<Spin />
					</div>
				) : null}
				{error ? (
					<iframe
						src={source}
						title="PDF"
						className="h-full w-full border-0"
					/>
				) : null}
				{pdf && renderWidth > 0 ? (
					<div className="flex justify-center">
						<PdfPage pdf={pdf} pageNumber={pageNumber} width={renderWidth} />
					</div>
				) : null}
			</div>
		</div>
	)
}
