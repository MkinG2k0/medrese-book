import type { OfflineProgramBundle } from './types'

let cached: OfflineProgramBundle | null = null

export function getProgramBundleSync(): OfflineProgramBundle | null {
	return cached
}

export function setProgramBundle(bundle: OfflineProgramBundle): void {
	cached = bundle
}
