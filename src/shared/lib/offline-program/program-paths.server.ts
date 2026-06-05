import path from 'node:path'

/** Статический JSON программы (генерируется pnpm offline:bundle перед build, не в git). */
export const OFFLINE_PROGRAM_PUBLIC_FILE = path.join(
	process.cwd(),
	'public',
	'offline',
	'program.json',
)
