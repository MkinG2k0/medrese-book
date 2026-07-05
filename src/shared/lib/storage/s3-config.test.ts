import { afterEach, describe, expect, it } from 'vitest'

import {
	buildS3ObjectKey,
	buildS3PublicUrl,
	getS3KeyPrefix,
	isS3Configured,
} from './s3-config'

const ENV_KEYS = [
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'AWS_REGION',
	'S3_BUCKET',
	'S3_PUBLIC_URL',
	'S3_ENDPOINT',
	'S3_PREFIX',
] as const

function clearS3Env(): void {
	for (const key of ENV_KEYS) {
		delete process.env[key]
	}
}

describe('s3-config', () => {
	afterEach(() => {
		clearS3Env()
	})

	it('isS3Configured возвращает false без обязательных переменных', () => {
		clearS3Env()
		expect(isS3Configured()).toBe(false)
	})

	it('isS3Configured возвращает true при полном наборе переменных', () => {
		process.env.AWS_ACCESS_KEY_ID = 'key'
		process.env.AWS_SECRET_ACCESS_KEY = 'secret'
		process.env.AWS_REGION = 'eu-central-1'
		process.env.S3_BUCKET = 'medrese-uploads'

		expect(isS3Configured()).toBe(true)
	})

	it('getS3KeyPrefix по умолчанию uploads', () => {
		delete process.env.S3_PREFIX
		expect(getS3KeyPrefix()).toBe('uploads')
	})

	it('buildS3ObjectKey добавляет префикс и санитизирует имя', () => {
		expect(buildS3ObjectKey('photo (1).png', 'uploads')).toBe('uploads/photo__1_.png')
	})

	it('buildS3PublicUrl использует S3_PUBLIC_URL', () => {
		const url = buildS3PublicUrl('uploads/file.png', {
			accessKeyId: 'key',
			secretAccessKey: 'secret',
			region: 'eu-central-1',
			bucket: 'medrese-uploads',
			publicUrl: 'https://cdn.example.com/',
			keyPrefix: 'uploads',
		})

		expect(url).toBe('https://cdn.example.com/uploads/file.png')
	})

	it('buildS3PublicUrl строит URL Yandex Object Storage через endpoint', () => {
		const url = buildS3PublicUrl('uploads/file.png', {
			accessKeyId: 'key',
			secretAccessKey: 'secret',
			region: 'ru-central1',
			bucket: 'medrese-uploads',
			endpoint: 'https://storage.yandexcloud.net',
			keyPrefix: 'uploads',
		})

		expect(url).toBe('https://storage.yandexcloud.net/medrese-uploads/uploads/file.png')
	})

	it('buildS3PublicUrl строит стандартный AWS URL без endpoint', () => {
		const url = buildS3PublicUrl('uploads/file.png', {
			accessKeyId: 'key',
			secretAccessKey: 'secret',
			region: 'eu-central-1',
			bucket: 'medrese-uploads',
			keyPrefix: 'uploads',
		})

		expect(url).toBe('https://medrese-uploads.s3.eu-central-1.amazonaws.com/uploads/file.png')
	})
})
