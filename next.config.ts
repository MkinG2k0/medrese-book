import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

import withPWA from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

function getOfflineProgramRevision(): string | null {
	const filePath = 'public/offline/program.json'
	if (!existsSync(filePath)) return null
	return createHash('md5').update(readFileSync(filePath)).digest('hex')
}

const offlineProgramRevision = getOfflineProgramRevision()

const additionalManifestEntries: Array<{ url: string; revision: string | null }> = [
	{ url: '/profile', revision: null },
	{ url: '/manifest.json', revision: null },
	{ url: '/icons/icon-192.png', revision: null },
]
if (offlineProgramRevision) {
	additionalManifestEntries.unshift({
		url: '/offline/program.json',
		revision: offlineProgramRevision,
	})
}

const withPWAConfig = withPWA({
	dest: 'public',
	// В dev PWA + webpack → бесконечная пересборка; офлайн-тест: pnpm build && pnpm start
	disable: process.env.NODE_ENV === 'development',
	register: true,
	cacheStartUrl: true,
	// Главная всегда один и тот же HTML → кладём / в precache (иначе офлайн = ERR_INTERNET_DISCONNECTED)
	dynamicStartUrl: false,
	cacheOnFrontEndNav: true,
	reloadOnOnline: true,
	extendDefaultRuntimeCaching: true,
	fallbacks: {
		document: '/',
	},
	workboxOptions: {
		skipWaiting: true,
		clientsClaim: true,
		navigateFallback: '/',
		navigateFallbackDenylist: [/^\/api\//, /^\/admin/, /^\/login/, /^\/teacher/],
		additionalManifestEntries,
		runtimeCaching: [
			{
				urlPattern: /^\/offline\/program\.json$/,
				handler: 'CacheFirst',
				options: {
					cacheName: 'offline-program-static',
					expiration: { maxEntries: 1 },
				},
			},
			{
				urlPattern: ({ request }) => request.headers.get('RSC') === '1',
				handler: 'StaleWhileRevalidate',
				options: {
					cacheName: 'next-rsc',
					expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 },
				},
			},
			{
				urlPattern: ({ request, url }) =>
					request.mode === 'navigate' && url.pathname === '/profile',
				handler: 'CacheFirst',
				options: {
					cacheName: 'pages-profile',
					expiration: { maxEntries: 1 },
				},
			},
			{
				urlPattern: /\/uploads\/.+/,
				handler: 'CacheFirst',
				options: {
					cacheName: 'uploads',
					expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
				},
			},
			{
				urlPattern: /^https:\/\/upload\.wikimedia\.org\/.+/,
				handler: 'CacheFirst',
				options: {
					cacheName: 'external-images',
					expiration: { maxEntries: 100 },
				},
			},
		],
	},
})

const nextConfig: NextConfig = {
	turbopack: {},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'upload.wikimedia.org',
				pathname: '/**',
			},
		],
	},
}

export default withPWAConfig(nextConfig)
