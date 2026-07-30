### Task 1: Storage-С…РµР»РїРµСЂ С‡РµСЂРЅРѕРІРёРєР°

**Files:**
- Create: `src/features/extra-assignments/lib/extra-assignment-draft.ts`
- Test: `src/features/extra-assignments/lib/extra-assignment-draft.test.ts`

**Interfaces:**
- Consumes: `StepContent`, `stepContentSchema` РёР· `@/shared/lib/validations/step`
- Produces:
  - `type ExtraAssignmentCreateDraft = { title: string; levelId?: string; stepId: string | null; content: StepContent }`
  - `draftStorageKey(userId: string, subjectId: string): string`
  - `readExtraAssignmentDraft(userId: string, subjectId: string): ExtraAssignmentCreateDraft | null`
  - `writeExtraAssignmentDraft(userId: string, subjectId: string, draft: ExtraAssignmentCreateDraft): void`
  - `clearExtraAssignmentDraft(userId: string, subjectId: string): void`

- [ ] **Step 1: Write the failing test**

Create `src/features/extra-assignments/lib/extra-assignment-draft.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	clearExtraAssignmentDraft,
	draftStorageKey,
	readExtraAssignmentDraft,
	writeExtraAssignmentDraft,
} from '@/features/extra-assignments/lib/extra-assignment-draft'

function createLocalStorageMock() {
	const store = new Map<string, string>()
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value)
		},
		removeItem: (key: string) => {
			store.delete(key)
		},
		clear: () => store.clear(),
	}
}

const sampleDraft = {
	title: 'РџРѕРІС‚РѕСЂ СЃСѓСЂС‹',
	levelId: 'lvl1',
	stepId: 'step1',
	content: { blocks: [{ type: 'text' as const, value: 'С‚РµРєСЃС‚' }] },
}

describe('extra-assignment-draft', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createLocalStorageMock())
		vi.stubGlobal('window', {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('builds storage key from user and subject', () => {
		expect(draftStorageKey('u1', 's1')).toBe('extra-assignment-draft:u1:s1')
	})

	it('reads and writes draft', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		expect(readExtraAssignmentDraft('u1', 's1')).toEqual(sampleDraft)
	})

	it('returns null when key is missing', () => {
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('isolates drafts by subject', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		expect(readExtraAssignmentDraft('u1', 's2')).toBeNull()
	})

	it('clears draft', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		clearExtraAssignmentDraft('u1', 's1')
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on invalid JSON', () => {
		localStorage.setItem(draftStorageKey('u1', 's1'), '{not-json')
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on invalid shape', () => {
		localStorage.setItem(
			draftStorageKey('u1', 's1'),
			JSON.stringify({ title: 1, content: null }),
		)
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on SSR', () => {
		vi.unstubAllGlobals()
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/features/extra-assignments/lib/extra-assignment-draft.test.ts`

Expected: FAIL вЂ” module not found / exports missing

- [ ] **Step 3: Write minimal implementation**

Create `src/features/extra-assignments/lib/extra-assignment-draft.ts`:

```ts
import {
	stepContentSchema,
	type StepContent,
} from '@/shared/lib/validations/step'

export type ExtraAssignmentCreateDraft = {
	title: string
	levelId?: string
	stepId: string | null
	content: StepContent
}

export function draftStorageKey(userId: string, subjectId: string): string {
	return `extra-assignment-draft:${userId}:${subjectId}`
}

function isDraft(value: unknown): value is ExtraAssignmentCreateDraft {
	if (!value || typeof value !== 'object') return false
	const v = value as Record<string, unknown>
	if (typeof v.title !== 'string') return false
	if (v.levelId !== undefined && typeof v.levelId !== 'string') return false
	if (!(v.stepId === null || typeof v.stepId === 'string')) return false
	const content = stepContentSchema.safeParse(v.content)
	return content.success
}

export function readExtraAssignmentDraft(
	userId: string,
	subjectId: string,
): ExtraAssignmentCreateDraft | null {
	if (typeof window === 'undefined') return null
	if (!userId || !subjectId) return null

	try {
		const raw = localStorage.getItem(draftStorageKey(userId, subjectId))
		if (!raw) return null
		const parsed: unknown = JSON.parse(raw)
		if (!isDraft(parsed)) return null
		return {
			title: parsed.title,
			levelId: parsed.levelId,
			stepId: parsed.stepId,
			content: parsed.content,
		}
	} catch {
		return null
	}
}

export function writeExtraAssignmentDraft(
	userId: string,
	subjectId: string,
	draft: ExtraAssignmentCreateDraft,
): void {
	if (typeof window === 'undefined') return
	if (!userId || !subjectId) return

	try {
		localStorage.setItem(draftStorageKey(userId, subjectId), JSON.stringify(draft))
	} catch {
		/* ignore */
	}
}

export function clearExtraAssignmentDraft(
	userId: string,
	subjectId: string,
): void {
	if (typeof window === 'undefined') return
	if (!userId || !subjectId) return

	try {
		localStorage.removeItem(draftStorageKey(userId, subjectId))
	} catch {
		/* ignore */
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/features/extra-assignments/lib/extra-assignment-draft.test.ts`

Expected: PASS (all tests)

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/features/extra-assignments/lib/extra-assignment-draft.ts src/features/extra-assignments/lib/extra-assignment-draft.test.ts
git commit -m "$(cat <<'EOF'
feat(extra-assignments): add localStorage draft helpers

EOF
)"
```

---
