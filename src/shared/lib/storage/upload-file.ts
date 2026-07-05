import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
	buildS3ObjectKey,
	buildS3PublicUrl,
	getS3Config,
	isS3Configured,
} from './s3-config'

export type UploadFileInput = {
	filename: string
	buffer: Buffer
	contentType?: string
}

export type UploadFileResult = {
	url: string
	storage: 's3' | 'local'
	key?: string
}

function sanitizeFilename(originalName: string): string {
	return `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
}

function createS3Client(config: NonNullable<ReturnType<typeof getS3Config>>): S3Client {
	return new S3Client({
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		...(config.endpoint
			? {
					endpoint: config.endpoint,
					forcePathStyle: true,
				}
			: {}),
	})
}

async function uploadToS3(input: UploadFileInput): Promise<UploadFileResult> {
	const config = getS3Config()
	if (!config) {
		throw new Error('S3 не настроен')
	}

	const filename = sanitizeFilename(input.filename)
	const key = buildS3ObjectKey(filename, config.keyPrefix)
	const client = createS3Client(config)

	await client.send(
		new PutObjectCommand({
			Bucket: config.bucket,
			Key: key,
			Body: input.buffer,
			ContentType: input.contentType ?? 'application/octet-stream',
		}),
	)

	return {
		url: buildS3PublicUrl(key, config),
		storage: 's3',
		key,
	}
}

async function uploadToLocal(input: UploadFileInput): Promise<UploadFileResult> {
	const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
	await mkdir(uploadsDir, { recursive: true })

	const filename = sanitizeFilename(input.filename)
	await writeFile(path.join(uploadsDir, filename), input.buffer)

	return {
		url: `/uploads/${filename}`,
		storage: 'local',
	}
}

export async function uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
	if (isS3Configured()) {
		return uploadToS3(input)
	}

	return uploadToLocal(input)
}
