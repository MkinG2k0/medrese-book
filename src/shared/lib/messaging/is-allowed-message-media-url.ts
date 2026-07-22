import { getS3Config } from '@/shared/lib/storage/s3-config'

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, '')
}

function getAllowedS3Bases(): string[] {
	const config = getS3Config()
	if (!config) return []

	const bases: string[] = []

	if (config.publicUrl) {
		bases.push(trimTrailingSlash(config.publicUrl))
	}

	if (config.endpoint) {
		bases.push(`${trimTrailingSlash(config.endpoint)}/${config.bucket}`)
	}

	bases.push(`https://${config.bucket}.s3.${config.region}.amazonaws.com`)

	return bases
}

export function isAllowedMessageMediaUrl(url: string): boolean {
	const trimmed = url.trim()
	if (!trimmed) return false

	if (trimmed.startsWith('/uploads/')) return true

	if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
		return false
	}

	return getAllowedS3Bases().some(
		(base) => trimmed === base || trimmed.startsWith(`${base}/`),
	)
}
