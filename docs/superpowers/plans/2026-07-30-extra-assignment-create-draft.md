# Черновик создания доп. задания — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять черновик формы создания доп. задания в `localStorage` и запретить закрытие модалки кликом по затемнению.

**Architecture:** Клиентский модуль `extra-assignment-draft.ts` (ключ `extra-assignment-draft:{userId}:{subjectId}`). `ExtraAssignmentFormModal` в режиме create гидратирует/пишет черновик с debounce, «Отмена» очищает, крестик/Escape — нет. Каталог передаёт `subjectId` и очищает черновик после успешного create.

**Tech Stack:** React 19, Ant Design Modal, `localStorage`, Vitest, Zod `stepContentSchema`, существующий `useDebounce`.

**Spec:** `docs/superpowers/specs/2026-07-30-extra-assignment-create-draft-design.md`

## Global Constraints

- UI и сообщения на русском
- Черновик только для режима **создания** (`assignment === null`)
- Очистка: успешное сохранение + кнопка «Отмена»; крестик/Escape черновик не трогают
- `maskClosable={false}` на модалке create и edit
- Модалка «Дать доп. задание» в журнале — без изменений
- Паттерн storage как в `src/features/journal/lib/journal-storage.ts` (SSR-safe, try/catch)
- Коммиты — только если пользователь явно попросил; иначе оставлять изменения незакоммиченными

## File map

| File | Role |
|------|------|
| `src/features/extra-assignments/lib/extra-assignment-draft.ts` | read / write / clear + тип черновика |
| `src/features/extra-assignments/lib/extra-assignment-draft.test.ts` | Unit-тесты storage |
| `src/features/extra-assignments/ui/ExtraAssignmentFormModal.tsx` | Hydrate, debounce save, split cancel handlers, maskClosable |
| `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx` | Передать `subjectId`; clear после успешного create |

### Clear responsibility

| Event | Who clears |
|-------|------------|
| «Отмена» | Modal |
| Successful create | Catalog `handleSave` |
| Крестик / Escape | Nobody |
| Failed save | Nobody |

---

### Task 1: Storage-хелпер черновика

**Files:**
- Create: `src/features/extra-assignments/lib/extra-assignment-draft.ts`
- Test: `src/features/extra-assignments/lib/extra-assignment-draft.test.ts`

**Interfaces:**
- Consumes: `StepContent`, `stepContentSchema` из `@/shared/lib/validations/step`
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
	title: 'Повтор суры',
	levelId: 'lvl1',
	stepId: 'step1',
	content: { blocks: [{ type: 'text' as const, value: 'текст' }] },
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

Expected: FAIL — module not found / exports missing

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

### Task 2: Модалка — черновик + maskClosable

**Files:**
- Modify: `src/features/extra-assignments/ui/ExtraAssignmentFormModal.tsx`
- Modify: `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx`

**Interfaces:**
- Consumes: `readExtraAssignmentDraft`, `writeExtraAssignmentDraft`, `clearExtraAssignmentDraft`; `useDebounce` from `@/shared/lib/use-debounce`
- Produces: `ExtraAssignmentFormModal` принимает обязательный `subjectId: string`; `Modal.onCancel` = мягкое закрытие; footer «Отмена» = clear + `onCancel`

- [ ] **Step 1: Wire `subjectId` and clear-on-success in catalog**

In `ExtraAssignmentCatalogPage.tsx`:

1. Import:

```ts
import { clearExtraAssignmentDraft } from '@/features/extra-assignments/lib/extra-assignment-draft'
```

2. In `handleSave`, after successful create/update (inside the `try`, before closing modal):

```ts
if (!editing && session?.user?.id) {
	clearExtraAssignmentDraft(session.user.id, selectedSubjectId)
}
setModalOpen(false)
setEditing(null)
```

3. Pass prop to modal:

```tsx
<ExtraAssignmentFormModal
	open={modalOpen}
	assignment={editing}
	subjectId={selectedSubjectId}
	programLevels={programLevels}
	currentUserId={currentUserId}
	loading={createMutation.isPending || updateMutation.isPending}
	onCancel={() => {
		setModalOpen(false)
		setEditing(null)
	}}
	onSave={handleSave}
	onDelete={editing ? () => handleDelete(editing) : undefined}
/>
```

- [ ] **Step 2: Update `ExtraAssignmentFormModal`**

Rewrite `src/features/extra-assignments/ui/ExtraAssignmentFormModal.tsx` to:

```tsx
'use client'

import { Button, Form, Input, Modal, Select } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ExtraAssignmentTemplate } from '@/entities/extra-assignment'
import {
	clearExtraAssignmentDraft,
	readExtraAssignmentDraft,
	writeExtraAssignmentDraft,
} from '@/features/extra-assignments/lib/extra-assignment-draft'
import { StepEditor } from '@/features/program-admin/ui/editor/StepEditor'
import { useDebounce } from '@/shared/lib/use-debounce'
import type { StepContent } from '@/shared/lib/validations/step'

export type ProgramLevelWithSteps = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string; levelId: string }[]
}

type ExtraAssignmentFormModalProps = {
	open: boolean
	assignment: ExtraAssignmentTemplate | null
	subjectId: string
	programLevels: ProgramLevelWithSteps[]
	currentUserId?: string
	loading?: boolean
	onCancel: () => void
	onSave: (values: {
		title: string
		stepId: string | null
		content: StepContent
	}) => void | Promise<void>
	onDelete?: () => void
}

const EMPTY_CONTENT: StepContent = { blocks: [{ type: 'text', value: '' }] }

export function ExtraAssignmentFormModal({
	open,
	assignment,
	subjectId,
	programLevels,
	currentUserId,
	loading,
	onCancel,
	onSave,
	onDelete,
}: ExtraAssignmentFormModalProps) {
	const [title, setTitle] = useState('')
	const [stepId, setStepId] = useState<string | null>(null)
	const [levelId, setLevelId] = useState<string | undefined>()
	const [content, setContent] = useState<StepContent>(EMPTY_CONTENT)
	const [editorKey, setEditorKey] = useState('new')
	const skipNextDraftWrite = useRef(false)

	const isCreate = !assignment

	useEffect(() => {
		if (!open) return

		if (assignment) {
			skipNextDraftWrite.current = true
			setTitle(assignment.title)
			setStepId(assignment.stepId)
			setLevelId(assignment.step?.levelId)
			setContent(assignment.content)
			setEditorKey(assignment.id)
			return
		}

		const draft =
			currentUserId && subjectId
				? readExtraAssignmentDraft(currentUserId, subjectId)
				: null

		skipNextDraftWrite.current = true
		if (draft) {
			setTitle(draft.title)
			setStepId(draft.stepId)
			setLevelId(draft.levelId)
			setContent(draft.content)
			setEditorKey(
				`draft-${subjectId}-${draft.title.length}-${draft.content.blocks.length}`,
			)
		} else {
			setTitle('')
			setStepId(null)
			setLevelId(undefined)
			setContent(EMPTY_CONTENT)
			setEditorKey(`new-${subjectId}`)
		}
	}, [open, assignment, currentUserId, subjectId])

	const draftSnapshot = useMemo(
		() => ({ title, levelId, stepId, content }),
		[title, levelId, stepId, content],
	)
	const debouncedDraft = useDebounce(draftSnapshot, 300)

	useEffect(() => {
		if (!open || !isCreate || !currentUserId || !subjectId) return
		if (skipNextDraftWrite.current) {
			skipNextDraftWrite.current = false
			return
		}
		writeExtraAssignmentDraft(currentUserId, subjectId, {
			title: debouncedDraft.title,
			levelId: debouncedDraft.levelId,
			stepId: debouncedDraft.stepId,
			content: debouncedDraft.content,
		})
	}, [open, isCreate, currentUserId, subjectId, debouncedDraft])

	const handleDismissKeepDraft = () => {
		onCancel()
	}

	const handleCancelClearDraft = () => {
		if (isCreate && currentUserId && subjectId) {
			clearExtraAssignmentDraft(currentUserId, subjectId)
		}
		onCancel()
	}

	const levelOptions = programLevels.map((level) => ({
		value: level.id,
		label: `Уровень ${level.number}: ${level.title}`,
	}))

	const stepOptions = useMemo(() => {
		const levels = levelId
			? programLevels.filter((level) => level.id === levelId)
			: programLevels
		return levels.flatMap((level) =>
			level.steps.map((step) => ({
				value: step.id,
				label: `Шаг ${step.order}: ${step.title}`,
			})),
		)
	}, [programLevels, levelId])

	const canDelete =
		assignment && currentUserId && assignment.authorId === currentUserId

	return (
		<Modal
			title={assignment ? 'Редактировать задание' : 'Создать задание'}
			open={open}
			onCancel={handleDismissKeepDraft}
			maskClosable={false}
			footer={
				<div className="flex justify-between gap-2">
					<div>
						{canDelete && onDelete ? (
							<Button danger onClick={onDelete}>
								Удалить
							</Button>
						) : null}
					</div>
					<div className="flex gap-2">
						<Button onClick={handleCancelClearDraft}>Отмена</Button>
						<Button
							type="primary"
							loading={loading}
							onClick={() => void onSave({ title, stepId, content })}
							disabled={!title.trim()}
						>
							Сохранить
						</Button>
					</div>
				</div>
			}
			width={720}
			destroyOnHidden
		>
			<Form layout="vertical">
				<Form.Item label="Название" required>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} />
				</Form.Item>
				<div className="flex flex-wrap gap-4">
					<Form.Item label="Уровень" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="Любой"
							options={levelOptions}
							value={levelId}
							onChange={(value) => {
								setLevelId(value)
								setStepId(null)
							}}
						/>
					</Form.Item>
					<Form.Item label="Шаг программы" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="Не привязан"
							options={stepOptions}
							value={stepId ?? undefined}
							onChange={(value) => setStepId(value ?? null)}
						/>
					</Form.Item>
				</div>
				<Form.Item label="Содержание">
					<StepEditor
						key={editorKey}
						initialContent={content}
						onChange={setContent}
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
```

- [ ] **Step 3: Typecheck touched area**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`

Expected: no errors about missing `subjectId` or draft module

- [ ] **Step 4: Re-run unit tests**

Run: `pnpm exec vitest run src/features/extra-assignments/lib/extra-assignment-draft.test.ts`

Expected: PASS

- [ ] **Step 5: Manual verification**

1. `/extra-assignments` → «Создать» → ввести название и текст → клик по затемнению → окно **не** закрылось.
2. Escape → закрылось → снова «Создать» → данные на месте.
3. «Отмена» → снова «Создать» → пусто.
4. Ввести → «Сохранить» (успех) → снова «Создать» → пусто.
5. Ввести → F5 → «Создать» → данные на месте.
6. «Изменить» существующее → поля с сервера, не из create-черновика; клик снаружи не закрывает.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add \
  src/features/extra-assignments/lib/extra-assignment-draft.ts \
  src/features/extra-assignments/lib/extra-assignment-draft.test.ts \
  src/features/extra-assignments/ui/ExtraAssignmentFormModal.tsx \
  src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx \
  docs/superpowers/specs/2026-07-30-extra-assignment-create-draft-design.md \
  docs/superpowers/plans/2026-07-30-extra-assignment-create-draft.md
git commit -m "$(cat <<'EOF'
feat(extra-assignments): persist create form draft in localStorage

EOF
)"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| localStorage draft for create | Task 1 + 2 |
| Key `userId:subjectId` | Task 1 |
| Debounced write | Task 2 (`useDebounce` 300ms) |
| Clear on save + «Отмена» | Task 2 (catalog + modal) |
| Keep on X / Escape | Task 2 |
| `maskClosable={false}` | Task 2 |
| Edit without draft | Task 2 |
| SSR / invalid JSON / missing user | Task 1 |
| Assign modal unchanged | Not touched |
| No draft badge UI | YAGNI — skipped |
