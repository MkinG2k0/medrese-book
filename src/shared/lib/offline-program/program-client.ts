import { getProgramBundleSync } from './bundle-cache'
import { loadProgramBundle } from './sync'
import type { OfflineProgramBundle } from './types'

export async function fetchFromProgramBundle<T>(
	resolver: (bundle: OfflineProgramBundle) => T | null,
): Promise<T> {
	const sync = getProgramBundleSync()
	if (sync) {
		const hit = resolver(sync)
		if (hit) return hit
	}

	const bundle = await loadProgramBundle()
	if (!bundle) throw new Error('Программа уроков не загружена')

	const result = resolver(bundle)
	if (!result) throw new Error('Данные не найдены')

	return result
}
