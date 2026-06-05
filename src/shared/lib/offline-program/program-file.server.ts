import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { PrismaClient } from '../../../../generated/prisma/client'

import { buildOfflineProgramBundle } from './build-bundle'
import { OFFLINE_PROGRAM_PUBLIC_FILE } from './program-paths.server'
import type { OfflineProgramBundle } from './types'

function isValidBundle(data: unknown): data is OfflineProgramBundle {
	if (!data || typeof data !== 'object') return false
	const bundle = data as OfflineProgramBundle
	return Array.isArray(bundle.steps) && bundle.steps.length > 0
}

export async function readProgramBundleFromFile(): Promise<OfflineProgramBundle | null> {
	try {
		const raw = await readFile(OFFLINE_PROGRAM_PUBLIC_FILE, 'utf8')
		const parsed = JSON.parse(raw) as unknown
		return isValidBundle(parsed) ? parsed : null
	} catch {
		return null
	}
}

export async function writeProgramBundleToFile(
	bundle: OfflineProgramBundle,
): Promise<void> {
	const json = JSON.stringify(bundle)
	await writeFile(OFFLINE_PROGRAM_PUBLIC_FILE, json, 'utf8')
}

/** Legacy: пересборка из БД и запись в public/offline/program.json. */
export async function buildProgramBundleFromDatabase(
	prisma: PrismaClient,
): Promise<OfflineProgramBundle> {
	return buildOfflineProgramBundle(prisma)
}
