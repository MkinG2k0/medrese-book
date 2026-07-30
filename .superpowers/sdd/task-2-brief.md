### Task 2: РњРѕРґР°Р»РєР° вЂ” С‡РµСЂРЅРѕРІРёРє + maskClosable

**Files:**
- Modify: `src/features/extra-assignments/ui/ExtraAssignmentFormModal.tsx`
- Modify: `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx`

**Interfaces:**
- Consumes: `readExtraAssignmentDraft`, `writeExtraAssignmentDraft`, `clearExtraAssignmentDraft`; `useDebounce` from `@/shared/lib/use-debounce`
- Produces: `ExtraAssignmentFormModal` РїСЂРёРЅРёРјР°РµС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ `subjectId: string`; `Modal.onCancel` = РјСЏРіРєРѕРµ Р·Р°РєСЂС‹С‚РёРµ; footer В«РћС‚РјРµРЅР°В» = clear + `onCancel`

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
		label: `РЈСЂРѕРІРµРЅСЊ ${level.number}: ${level.title}`,
	}))

	const stepOptions = useMemo(() => {
		const levels = levelId
			? programLevels.filter((level) => level.id === levelId)
			: programLevels
		return levels.flatMap((level) =>
			level.steps.map((step) => ({
				value: step.id,
				label: `РЁР°Рі ${step.order}: ${step.title}`,
			})),
		)
	}, [programLevels, levelId])

	const canDelete =
		assignment && currentUserId && assignment.authorId === currentUserId

	return (
		<Modal
			title={assignment ? 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ Р·Р°РґР°РЅРёРµ' : 'РЎРѕР·РґР°С‚СЊ Р·Р°РґР°РЅРёРµ'}
			open={open}
			onCancel={handleDismissKeepDraft}
			maskClosable={false}
			footer={
				<div className="flex justify-between gap-2">
					<div>
						{canDelete && onDelete ? (
							<Button danger onClick={onDelete}>
								РЈРґР°Р»РёС‚СЊ
							</Button>
						) : null}
					</div>
					<div className="flex gap-2">
						<Button onClick={handleCancelClearDraft}>РћС‚РјРµРЅР°</Button>
						<Button
							type="primary"
							loading={loading}
							onClick={() => void onSave({ title, stepId, content })}
							disabled={!title.trim()}
						>
							РЎРѕС…СЂР°РЅРёС‚СЊ
						</Button>
					</div>
				</div>
			}
			width={720}
			destroyOnHidden
		>
			<Form layout="vertical">
				<Form.Item label="РќР°Р·РІР°РЅРёРµ" required>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} />
				</Form.Item>
				<div className="flex flex-wrap gap-4">
					<Form.Item label="РЈСЂРѕРІРµРЅСЊ" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="Р›СЋР±РѕР№"
							options={levelOptions}
							value={levelId}
							onChange={(value) => {
								setLevelId(value)
								setStepId(null)
							}}
						/>
					</Form.Item>
					<Form.Item label="РЁР°Рі РїСЂРѕРіСЂР°РјРјС‹" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="РќРµ РїСЂРёРІСЏР·Р°РЅ"
							options={stepOptions}
							value={stepId ?? undefined}
							onChange={(value) => setStepId(value ?? null)}
						/>
					</Form.Item>
				</div>
				<Form.Item label="РЎРѕРґРµСЂР¶Р°РЅРёРµ">
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

1. `/extra-assignments` в†’ В«РЎРѕР·РґР°С‚СЊВ» в†’ РІРІРµСЃС‚Рё РЅР°Р·РІР°РЅРёРµ Рё С‚РµРєСЃС‚ в†’ РєР»РёРє РїРѕ Р·Р°С‚РµРјРЅРµРЅРёСЋ в†’ РѕРєРЅРѕ **РЅРµ** Р·Р°РєСЂС‹Р»РѕСЃСЊ.
2. Escape в†’ Р·Р°РєСЂС‹Р»РѕСЃСЊ в†’ СЃРЅРѕРІР° В«РЎРѕР·РґР°С‚СЊВ» в†’ РґР°РЅРЅС‹Рµ РЅР° РјРµСЃС‚Рµ.
3. В«РћС‚РјРµРЅР°В» в†’ СЃРЅРѕРІР° В«РЎРѕР·РґР°С‚СЊВ» в†’ РїСѓСЃС‚Рѕ.
4. Р’РІРµСЃС‚Рё в†’ В«РЎРѕС…СЂР°РЅРёС‚СЊВ» (СѓСЃРїРµС…) в†’ СЃРЅРѕРІР° В«РЎРѕР·РґР°С‚СЊВ» в†’ РїСѓСЃС‚Рѕ.
5. Р’РІРµСЃС‚Рё в†’ F5 в†’ В«РЎРѕР·РґР°С‚СЊВ» в†’ РґР°РЅРЅС‹Рµ РЅР° РјРµСЃС‚Рµ.
6. В«РР·РјРµРЅРёС‚СЊВ» СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРµ в†’ РїРѕР»СЏ СЃ СЃРµСЂРІРµСЂР°, РЅРµ РёР· create-С‡РµСЂРЅРѕРІРёРєР°; РєР»РёРє СЃРЅР°СЂСѓР¶Рё РЅРµ Р·Р°РєСЂС‹РІР°РµС‚.

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
