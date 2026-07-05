export type S3Config = {
	accessKeyId: string
	secretAccessKey: string
	region: string
	bucket: string
	endpoint?: string
	publicUrl?: string
	keyPrefix: string
}

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, '')
}

export function getS3KeyPrefix(): string {
	const prefix = process.env.S3_PREFIX?.trim()
	if (!prefix) return 'uploads'
	return prefix.replace(/^\/+|\/+$/g, '')
}

export function isS3Configured(): boolean {
	return Boolean(
		process.env.AWS_ACCESS_KEY_ID &&
			process.env.AWS_SECRET_ACCESS_KEY &&
			process.env.AWS_REGION &&
			process.env.S3_BUCKET,
	)
}

export function getS3Config(): S3Config | null {
	if (!isS3Configured()) return null

	const endpoint = process.env.S3_ENDPOINT?.trim() || undefined
	const publicUrl = process.env.S3_PUBLIC_URL?.trim() || undefined

	return {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		region: process.env.AWS_REGION!,
		bucket: process.env.S3_BUCKET!,
		endpoint,
		publicUrl,
		keyPrefix: getS3KeyPrefix(),
	}
}

export function buildS3ObjectKey(filename: string, prefix = getS3KeyPrefix()): string {
	const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
	return prefix ? `${prefix}/${safeName}` : safeName
}

export function buildS3PublicUrl(key: string, config: S3Config): string {
	if (config.publicUrl) {
		return `${trimTrailingSlash(config.publicUrl)}/${key}`
	}

	if (config.endpoint) {
		const endpoint = trimTrailingSlash(config.endpoint)
		return `${endpoint}/${config.bucket}/${key}`
	}

	return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`
}
