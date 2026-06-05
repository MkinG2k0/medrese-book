export const stepKeys = {
	all: ['steps'] as const,
	pages: () => [...stepKeys.all, 'page'] as const,
	page: (page: number, limit: number) => [...stepKeys.pages(), page, limit] as const,
	current: (excludeKey: string) => [...stepKeys.all, 'current', excludeKey] as const,
}
