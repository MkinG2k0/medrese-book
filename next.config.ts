import type { NextConfig } from 'next'

type RemotePattern = {
	protocol: 'http' | 'https'
	hostname: string
	pathname: string
}

function patternKey(pattern: RemotePattern): string {
	return `${pattern.protocol}://${pattern.hostname}${pattern.pathname ?? ''}`
}

function urlToRemotePattern(rawUrl: string): RemotePattern | null {
	try {
		const url = new URL(rawUrl)
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

		return {
			protocol: url.protocol.replace(':', '') as 'http' | 'https',
			hostname: url.hostname,
			pathname: '/**',
		}
	} catch {
		return null
	}
}

/** Hostnames for next/image — must match buildS3PublicUrl() in s3-config.ts */
function getS3RemotePatterns(): RemotePattern[] {
	const seen = new Set<string>()
	const patterns: RemotePattern[] = []

	const add = (rawUrl: string | undefined) => {
		if (!rawUrl) return
		const pattern = urlToRemotePattern(rawUrl)
		if (!pattern) return
		const key = patternKey(pattern)
		if (seen.has(key)) return
		seen.add(key)
		patterns.push(pattern)
	}

	add(process.env.S3_PUBLIC_URL?.trim())
	add(process.env.S3_ENDPOINT?.trim())

	const bucket = process.env.S3_BUCKET?.trim()
	const region = process.env.AWS_REGION?.trim()
	if (bucket && region && !process.env.S3_ENDPOINT?.trim() && !process.env.S3_PUBLIC_URL?.trim()) {
		add(`https://${bucket}.s3.${region}.amazonaws.com`)
	}

	return patterns
}

const nextConfig: NextConfig = {
	turbopack: {},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'upload.wikimedia.org',
				pathname: '/**',
			},
			...getS3RemotePatterns(),
		],
	},
}

export default nextConfig
