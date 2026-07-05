import type { NextConfig } from 'next'

function getS3RemotePattern(): NonNullable<NextConfig['images']>['remotePatterns'][number] | null {
	const publicUrl = process.env.S3_PUBLIC_URL?.trim()
	if (!publicUrl) return null

	try {
		const url = new URL(publicUrl)
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

const s3RemotePattern = getS3RemotePattern()

const nextConfig: NextConfig = {
	turbopack: {},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'upload.wikimedia.org',
				pathname: '/**',
			},
			...(s3RemotePattern ? [s3RemotePattern] : []),
		],
	},
}

export default nextConfig
