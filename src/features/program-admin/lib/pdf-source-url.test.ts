import { describe, expect, it } from 'vitest'

import {
	clampPdfZoom,
	isCrossOriginPdfUrl,
	pdfFileName,
	pdfSourceUrl,
	PDF_ZOOM_DEFAULT,
	PDF_ZOOM_MAX,
	PDF_ZOOM_MIN,
} from './pdf-source-url'

describe('pdfSourceUrl', () => {
	it('возвращает URL без изменений, если hash нет', () => {
		expect(pdfSourceUrl('/uploads/program/level1/step-1/lesson.pdf')).toBe(
			'/uploads/program/level1/step-1/lesson.pdf',
		)
	})

	it('отрезает параметры встроенного PDF viewer', () => {
		expect(
			pdfSourceUrl('/uploads/lesson.pdf#navpanes=0&zoom=75'),
		).toBe('/uploads/lesson.pdf')
	})
})

describe('pdfFileName', () => {
	it('берёт имя файла из пути', () => {
		expect(pdfFileName('/uploads/program/level1/step-1/lesson.pdf')).toBe(
			'lesson.pdf',
		)
	})
})

describe('clampPdfZoom', () => {
	it('ограничивает зум', () => {
		expect(clampPdfZoom(PDF_ZOOM_DEFAULT)).toBe(75)
		expect(clampPdfZoom(10)).toBe(PDF_ZOOM_MIN)
		expect(clampPdfZoom(400)).toBe(PDF_ZOOM_MAX)
	})
})

describe('isCrossOriginPdfUrl', () => {
	it('локальные пути считает same-origin', () => {
		expect(
			isCrossOriginPdfUrl(
				'/uploads/program/level1/step-1/lesson.pdf',
				'http://localhost:3000',
			),
		).toBe(false)
	})

	it('S3 URL считает cross-origin', () => {
		expect(
			isCrossOriginPdfUrl(
				'https://cdn.example/uploads/lesson.pdf',
				'https://app.example',
			),
		).toBe(true)
	})
})
