import { OFFLINE_PROGRAM_JSON_URL } from './program-paths'
import { getProgramBundleSync, setProgramBundle } from './bundle-cache'
import type { OfflineProgramBundle } from './types'

let loadPromise: Promise<OfflineProgramBundle | null> | null = null

function isValidBundle(
	bundle: OfflineProgramBundle | null,
): bundle is OfflineProgramBundle {
	return !!bundle?.steps?.length
}

/** Загружает программу из статического JSON в памяти (один раз за сессию). */
export function loadProgramBundle(): Promise<OfflineProgramBundle | null> {
	const existing = getProgramBundleSync()
	if (existing) return Promise.resolve(existing)

	if (loadPromise) return loadPromise

	loadPromise = (async () => {
		try {
			const res = await fetch(OFFLINE_PROGRAM_JSON_URL)
			if (!res.ok) return null
			const bundle = (await res.json()) as OfflineProgramBundle
			if (!isValidBundle(bundle)) return null
			setProgramBundle(bundle)
			return bundle
		} catch {
			return null
		}
	})().finally(() => {
		loadPromise = null
	})

	return loadPromise
}

export async function prefetchOfflineAssets(urls: string[]): Promise<void> {
	const sameOrigin = urls.filter((url) => url.startsWith('/'))
	await Promise.allSettled(
		sameOrigin.map((url) => fetch(url, { credentials: 'same-origin' })),
	)
}
