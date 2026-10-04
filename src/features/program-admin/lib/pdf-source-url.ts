/** Убирает hash-параметры Chromium PDF viewer — они ломают загрузку на iOS/WebKit. */
export function pdfSourceUrl(url: string): string {
	const hashIndex = url.indexOf('#')
	return hashIndex >= 0 ? url.slice(0, hashIndex) : url
}

export function pdfFileName(url: string): string {
	try {
		const path = pdfSourceUrl(url)
		const name = path.split('/').pop()
		return name ? decodeURIComponent(name) : 'документ.pdf'
	} catch {
		return 'документ.pdf'
	}
}

export const PDF_ZOOM_MIN = 50
export const PDF_ZOOM_MAX = 200
export const PDF_ZOOM_STEP = 25
export const PDF_ZOOM_DEFAULT = 75

export function clampPdfZoom(zoom: number): number {
	return Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, zoom))
}
