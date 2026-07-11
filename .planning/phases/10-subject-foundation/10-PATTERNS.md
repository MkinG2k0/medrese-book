# Phase 10: Subject Foundation - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 22
**Analogs found:** 20 / 22

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (Subject + Level.subjectId) | model | CRUD | `prisma/schema.prisma` Level/Step | exact |
| `prisma/migrations/*_add_subject/migration.sql` | migration | transform | `prisma/migrations/20260605184836_init/migration.sql` | role-match |
| `src/shared/lib/validations/subject.ts` | utility | transform | `src/shared/lib/validations/level.ts` | exact |
| `src/shared/lib/validations/level.ts` (+subjectId) | utility | transform | `src/shared/lib/validations/level.ts` | exact |
| `src/features/subject-admin/actions/subject-actions.ts` | service | CRUD | `src/features/groups/actions/group-actions.ts` | exact |
| `src/features/subject-admin/ui/SubjectsList.tsx` | component | CRUD | `src/features/groups/ui/GroupsList.tsx` | exact |
| `src/features/subject-admin/ui/CreateSubjectForm.tsx` | component | CRUD | `src/features/groups/ui/CreateGroupForm.tsx` | exact |
| `src/features/subject-admin/ui/EditSubjectForm.tsx` | component | CRUD | `src/features/groups/ui/EditGroupForm.tsx` | exact |
| `src/app/(dashboard)/admin/subjects/page.tsx` | route | request-response | `src/app/(dashboard)/groups/page.tsx` | exact |
| `src/features/program-admin/actions/program-actions.ts` | service | CRUD | same file (add subjectId scope) | exact |
| `src/features/program-admin/ui/LevelsTable.tsx` | component | CRUD | same file (+subjectId links) | exact |
| `src/features/program-admin/ui/LevelStepsTable.tsx` | component | CRUD | same file (+subjectId links) | exact |
| `src/features/program-admin/ui/StepForm.tsx` | component | CRUD | same file (+subject-scoped URLs) | exact |
| `src/app/(dashboard)/admin/subjects/[subjectId]/program/page.tsx` | route | request-response | `src/app/(dashboard)/admin/program/page.tsx` | exact |
| `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx` | route | request-response | `src/app/(dashboard)/admin/program/[levelId]/page.tsx` | exact |
| `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/new/page.tsx` | route | request-response | `src/app/(dashboard)/admin/program/[levelId]/steps/new/page.tsx` | exact |
| `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx` | route | request-response | `src/app/(dashboard)/admin/program/[levelId]/steps/[stepId]/edit/page.tsx` | exact |
| `src/shared/lib/student-progress/offsets.ts` | utility | transform | same file (scope by subjectId) | partial |
| `src/widgets/app-shell/ui/AppShell.tsx` | component | request-response | same file (menu key swap) | exact |
| `prisma/seed.ts` + `prisma/lib/seed-program.ts` | config | batch | `prisma/seed.ts`, `prisma/lib/seed-program.ts` | partial |
| Delete `src/app/(dashboard)/admin/program/**` | route | — | removal only | exact |
| E2E / README route refs | test/docs | — | no e2e hits for `/admin/program` | no analog |

## Pattern Assignments

### `prisma/schema.prisma` — Subject model + Level.subjectId (model, CRUD)

**Analog:** `prisma/schema.prisma` Level/Step (lines 153–175)

**Existing Level/Step pattern:**
```153:175:prisma/schema.prisma
model Level {
  id       String    @id @default(cuid())
  number   Int       @unique
  title    String
  students Student[]
  steps    Step[]
}

model Step {
  id          String           @id @default(cuid())
  levelId     String
  level       Level            @relation(fields: [levelId], references: [id], onDelete: Cascade)
  order       Int
  // ...
  @@unique([levelId, order])
}
```

**Apply for Subject:**
- `Subject`: `id @id @default(cuid())`, `name String`, `description String @default("")`, `createdAt` / `updatedAt` (per schema conventions rule)
- `Level`: add `subjectId String`, relation `subject Subject @relation(...)`, drop `number @unique`, add `@@unique([subjectId, number])`, `@@index([subjectId])`
- Fresh start (D-08): migration drops old global levels or truncates program data — follow destructive seed pattern in `prisma/seed.ts` (lines 59–64: `step.deleteMany` → `level.deleteMany`)

**Migration SQL analog** (`prisma/migrations/20260605184836_init/migration.sql`):
```53:59:prisma/migrations/20260605184836_init/migration.sql
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);
```
```121:124:prisma/migrations/20260605184836_init/migration.sql
CREATE UNIQUE INDEX "Level_number_key" ON "Level"("number");
CREATE UNIQUE INDEX "Step_levelId_order_key" ON "Step"("levelId", "order");
```
Replace `Level_number_key` with composite `Level_subjectId_number_key` (pattern like `Conversation_participant1Id_participant2Id_key` in messaging migration).

---

### `src/shared/lib/validations/subject.ts` (utility, transform)

**Analog:** `src/shared/lib/validations/level.ts`

**Full file pattern:**
```1:11:src/shared/lib/validations/level.ts
import { z } from 'zod'

export const createLevelSchema = z.object({
	number: z.number().int().min(1),
	title: z.string().min(1),
})

export const updateLevelSchema = createLevelSchema.partial()

export type CreateLevelInput = z.infer<typeof createLevelSchema>
export type UpdateLevelInput = z.infer<typeof updateLevelSchema>
```

**Subject variant (per UI-SPEC + D-01):**
- `createSubjectSchema`: `name: z.string().min(2, 'Название должно быть не короче 2 символов')`, `description: z.string().optional()` or empty-string transform
- `updateSubjectSchema = createSubjectSchema.partial()`
- Export inferred types `CreateSubjectInput`, `UpdateSubjectInput`

**Modify `level.ts`:** add `subjectId: z.string().min(1)` to `createLevelSchema`; keep `updateLevelSchema` partial (subjectId immutable after create).

---

### `src/features/subject-admin/actions/subject-actions.ts` (service, CRUD)

**Analog:** `src/features/groups/actions/group-actions.ts`

**Imports + auth + list (lines 1–28):**
```1:28:src/features/groups/actions/group-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

const createGroupSchema = z.object({
	name: z.string().min(1),
	teacherId: z.string(),
})
// ...
export async function getGroups() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.group.findMany({
		include: {
			teacher: { include: { user: true } },
			_count: { select: { students: true } },
		},
		orderBy: { name: 'asc' },
	})
}
```

**Create + revalidate (lines 71–78):**
```71:78:src/features/groups/actions/group-actions.ts
export async function createGroup(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createGroupSchema.parse(input)

	const group = await prisma.group.create({ data })
	revalidatePath('/groups')
	revalidatePath('/my-group')
	return group
}
```

**Subject actions to implement:**
| Action | Pattern source |
|--------|----------------|
| `getSubjects()` | `getGroups()` — `findMany` + `_count: { select: { levels: true } }`; aggregate step count via `levels._count.steps` or separate query |
| `getSubject(subjectId)` | `getGroup()` — `findUnique` + `notFound` data for page |
| `createSubject(input)` | `createGroup()` — parse `createSubjectSchema`, `revalidatePath('/admin/subjects')` |
| `updateSubject(subjectId, input)` | `updateGroup()` — existence check, `revalidatePath('/admin/subjects')`, `revalidatePath(\`/admin/subjects/${subjectId}/program\`)` |
| `deleteSubject(subjectId)` | `deleteUser()` guard pattern (see below) — block if `_count.levels > 0` |

**Delete guard analog** (`src/features/user-admin/actions/user-actions.ts` lines 313–317):
```313:317:src/features/user-admin/actions/user-actions.ts
	if (user.role === 'TEACHER' && user.teacher) {
		if (user.teacher.groups.length > 0) {
			throw new Error(
				'Нельзя удалить учителя с группами. Сначала переназначьте группы другому учителю.',
			)
```

Use message from UI-SPEC: `'Нельзя удалить предмет с программой. Сначала удалите все уровни.'`

Prefer **shared Zod** from `validations/subject.ts` over inline schema (groups uses inline — subject-admin should use shared file per D-13 discretion).

---

### `src/features/subject-admin/ui/SubjectsList.tsx` (component, CRUD)

**Analog:** `src/features/groups/ui/GroupsList.tsx`

**Layout + table + modals (lines 25–109):**
```25:109:src/features/groups/ui/GroupsList.tsx
export function GroupsList({ groups, teachers }: GroupsListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Группы</Title>
        <Button type="primary" onClick={() => setShowCreate(true)}>
          Создать группу
        </Button>
      </div>
      <Table
        dataSource={groups}
        rowKey="id"
        columns={[
          {
            title: "Название",
            dataIndex: "name",
            key: "name",
            render: (name: string, record) => (
              <Link href={`/groups/${record.id}`} className="text-[#c9a84c]">
                {name}
              </Link>
            ),
          },
          // ...
        ]}
      />
      <Modal title="Создать группу" open={showCreate} footer={null} destroyOnHidden>
        <CreateGroupForm onSuccess={() => { setShowCreate(false); router.refresh(); }} />
      </Modal>
      // edit modal ...
    </div>
  );
}
```

**Subject deltas (10-UI-SPEC):**
- Title: «Предметы»; CTA: «Создать предмет»
- Link target: `/admin/subjects/{id}/program` — **use default antd/Link styling** (do NOT copy `text-[#c9a84c]` from GroupsList)
- Columns: Описание (secondary «—» if empty), Tag «Уровней», Tag «Шагов», actions Edit + Delete (danger)
- Delete: `App.useApp().modal.confirm` — analog below

**Delete confirm pattern** (`src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx` lines 29, 111–128):
```29:29:src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx
	const { modal, message } = App.useApp()
```
```111:128:src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx
	const handleDelete = (assignment: ExtraAssignmentTemplate) => {
		modal.confirm({
			title: 'Удалить задание?',
			content: assignment.title,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				try {
					await deleteMutation.mutateAsync(assignment.id)
					message.success('Задание удалено')
				} catch (err) {
					message.error(err instanceof Error ? err.message : 'Ошибка удаления')
				}
			},
		})
	}
```

Wrap `SubjectsList` in `<App>` provider context (already in antd provider) or use `App.useApp()` at component top. On blocked delete: `message.error(...)` without opening confirm.

---

### `src/features/subject-admin/ui/CreateSubjectForm.tsx` + `EditSubjectForm.tsx` (component, CRUD)

**Analog:** `CreateGroupForm.tsx` / `EditGroupForm.tsx`

**Create pattern (lines 13–37):**
```13:37:src/features/groups/ui/CreateGroupForm.tsx
export function CreateGroupForm({ teachers, onSuccess }: CreateGroupFormProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { name: string; teacherId: string }) => {
		startTransition(async () => {
			await createGroup(values)
			form.resetFields()
			onSuccess?.()
		})
	}

	return (
		<Form form={form} layout="vertical" onFinish={onFinish}>
			<Form.Item name="name" label="Название" rules={[{ required: true }]}>
				<Input />
			</Form.Item>
			// ...
			<Button type="primary" htmlType="submit" loading={isPending}>
				Создать группу
			</Button>
		</Form>
	)
}
```

**Subject fields:** `name` (required, min 2), `description` (`Input.TextArea`, rows={3}, optional). Submit copy: «Создать предмет» / «Сохранить изменения». Import `createSubject` / `updateSubject` from `subject-actions`. Add `message.success` on success per UI-SPEC (groups relies on silent refresh — subject should show toast).

---

### `src/app/(dashboard)/admin/subjects/page.tsx` (route, request-response)

**Analog:** `src/app/(dashboard)/groups/page.tsx`

```1:22:src/app/(dashboard)/groups/page.tsx
import { getGroups, getTeachers } from '@/features/groups/actions/group-actions'
import { GroupsList } from '@/features/groups/ui/GroupsList'
import { requireRoles } from '@/shared/lib/session'

export default async function GroupsPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const [groups, teachers] = await Promise.all([getGroups(), getTeachers()])

	const rows = groups.map((g) => ({
		id: g.id,
		name: g.name,
		// ...
	}))

	return (
		<GroupsList groups={rows} teachers={teachers.map(...)} />
	)
}
```

**Subject page:** `requireRoles(['SUPER_ADMIN', 'MANAGER'])` (order matches program-admin), `getSubjects()`, map to `SubjectRow` with `levelCount`, `stepCount`, pass to `SubjectsList`. No secondary data fetch (unlike teachers).

---

### `src/features/program-admin/actions/program-actions.ts` (service, CRUD — refactor)

**Analog:** same file; add `subjectId` parameter to all level/step queries and mutations.

**Auth + list (lines 68–74):**
```68:74:src/features/program-admin/actions/program-actions.ts
export async function getLevels() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findMany({
		include: { _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})
}
```

**Refactor to:**
- `getLevels(subjectId: string)` — add `where: { subjectId }`
- `getLevel(levelId, subjectId?)` — verify level belongs to subject (or join `subjectId` in where)
- `createLevel(input)` — `createLevelSchema` includes `subjectId`; verify subject exists
- `revalidatePath` targets: replace `/admin/program` → `/admin/subjects/${subjectId}/program` and nested level/step paths

**Create + revalidate (lines 89–94):**
```89:94:src/features/program-admin/actions/program-actions.ts
export async function createLevel(input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createLevelSchema.parse(input)
	const level = await prisma.level.create({ data })
	revalidatePath('/admin/program')
	return level
}
```

**Step mutations** (lines 114–153): keep transaction helpers `reserveStepOrderSlot` / `moveStepOrder` unchanged; only update `revalidatePath` to subject-scoped URLs. Pass `subjectId` into revalidate from level lookup when only `levelId` is known.

---

### `src/features/program-admin/ui/LevelsTable.tsx` (component, CRUD — refactor)

**Analog:** same file + `subjectId` prop for links

```13:37:src/features/program-admin/ui/LevelsTable.tsx
export function LevelsTable({ levels }: { levels: LevelRow[] }) {
	return (
		<Table
			// ...
			columns={[
				// ...
				{
					title: 'Действия',
					key: 'actions',
					render: (_, record) => (
						<Link href={`/admin/program/${record.id}`}>
							<Button size="small">Редактировать</Button>
						</Link>
					),
				},
			]}
		/>
	)
}
```

**Change signature:** `{ subjectId: string; levels: LevelRow[] }`, link → `/admin/subjects/${subjectId}/program/${record.id}`.

---

### `src/features/program-admin/ui/LevelStepsTable.tsx` (component, CRUD — refactor)

**Analog:** same file

```16:51:src/features/program-admin/ui/LevelStepsTable.tsx
export function LevelStepsTable({
	levelId,
	steps,
}: {
	levelId: string
	steps: StepRow[]
}) {
	// ...
	<Link href={`/admin/program/${levelId}/steps/${record.id}/edit`}>
```

Add `subjectId: string`; link → `/admin/subjects/${subjectId}/program/${levelId}/steps/${record.id}/edit`.

---

### `src/features/program-admin/ui/StepForm.tsx` (component, CRUD — refactor)

**Analog:** same file

```32:41:src/features/program-admin/ui/StepForm.tsx
	const handleSubmit = () => {
		startTransition(async () => {
			const payload = { levelId, order, title, content, description, hours }
			if (stepId) {
				await updateStep(stepId, payload)
			} else {
				await createStep(payload)
			}
			window.location.href = `/admin/program/${levelId}`
		})
	}
```

Add prop `subjectId: string` (or `programBasePath: string`). Redirect/cancel URLs → `/admin/subjects/${subjectId}/program/${levelId}`.

---

### Program route pages under `admin/subjects/[subjectId]/program/` (route, request-response)

**Analog:** `src/app/(dashboard)/admin/program/*`

**Levels list page** (`admin/program/page.tsx`):
```9:22:src/app/(dashboard)/admin/program/page.tsx
export default async function ProgramPage() {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const levels = await getLevels();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Программа обучения</Title>
        <Link href="/admin/program/new">
          <Button type="primary">Новый уровень</Button>
        </Link>
      </div>
      <LevelsTable levels={levels} />
    </div>
  );
}
```

**Subject-scoped page:**
- `params: Promise<{ subjectId: string }>` (Next.js 16 pattern)
- `getSubject(subjectId)` — `notFound()` if missing (copy from edit step page)
- Title: subject `name` (not «Программа обучения»)
- `getLevels(subjectId)`; `<LevelsTable subjectId={subjectId} levels={levels} />`
- Empty state copy from UI-SPEC when `levels.length === 0`
- «Новый уровень»: modal (preferred per UI-SPEC) or inline form — if modal, mirror `GroupsList` + level create action

**Level steps page** (`admin/program/[levelId]/page.tsx`):
```16:45:src/app/(dashboard)/admin/program/[levelId]/page.tsx
export default async function LevelStepsPage({ params }: Props) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const { levelId } = await params;
  const level = await getLevelSteps(levelId);

  if (!level) return <Text>Уровень не найден</Text>;

  const stepOffset = await getStepOffsetForLevel(level.number);
  // ...
  <LevelStepsTable levelId={levelId} steps={...} />
}
```

**Subject-scoped:**
- Params: `{ subjectId, levelId }`
- Verify `level.subjectId === subjectId` or query with both
- `getStepOffsetForLevel(level.number, subjectId)` — see offsets refactor
- Links: edit level, new step → subject-scoped paths
- Optional `Breadcrumb`: Предметы → {subject.name} → {level.title}

**Step new/edit pages:** copy from `steps/new/page.tsx` and `steps/[stepId]/edit/page.tsx`; pass `subjectId` to `StepForm`; use `notFound()` for missing step.

---

### `src/shared/lib/student-progress/offsets.ts` (utility, transform — refactor)

**Analog:** same file; extend for per-subject scope (partial match — no multi-subject precedent yet)

**Current global cache (lines 3–39):**
```3:39:src/shared/lib/student-progress/offsets.ts
let cachedOffsets: Map<number, number> | null = null

export async function getStepOffsetForLevel(
	levelNumber: number,
): Promise<number> {
	if (!cachedOffsets) {
		cachedOffsets = await getLevelStepOffsets()
	}
	return cachedOffsets.get(levelNumber) ?? 0
}

export async function getLevelStepOffsets(): Promise<Map<number, number>> {
	const levels = await prisma.level.findMany({
		select: { number: true, _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})
	// cumulative offset by level.number
}
```

**Phase 10 change (admin program pages only in scope):**
- Add optional `subjectId: string` parameter
- Cache key: `Map<string, Map<number, number>>` keyed by `subjectId`
- `getLevelStepOffsets(subjectId)` — `where: { subjectId }`
- Call sites in new program pages pass `subjectId`
- **Do not** change journal/student call sites in Phase 10 (Phase 12) — keep backward-compatible overload or default behavior documented for executor

---

### `src/widgets/app-shell/ui/AppShell.tsx` (component, request-response)

**Analog:** same file — swap menu entry

**Menu def (lines 97–101):**
```97:101:src/widgets/app-shell/ui/AppShell.tsx
  "/admin/program": {
    key: "/admin/program",
    icon: <BookOutlined />,
    label: "Программа",
  },
```

**Manager order (lines 174–177):**
```174:177:src/widgets/app-shell/ui/AppShell.tsx
const managerMenuOrder = [
  "/groups",
  "/admin/users",
  "/admin/program",
```

**Replace with:**
```typescript
"/admin/subjects": {
  key: "/admin/subjects",
  icon: <BookOutlined />,
  label: "Предметы",
},
```
Update `managerMenuOrder` entry to `"/admin/subjects"`. Remove `/admin/program` key entirely (D-06). `selectedKey` logic already matches nested paths via `pathname.startsWith(\`${item.key}/\`)` (lines 336–339).

**Route auth:** `src/shared/lib/auth.config.ts` line 74 — `'/admin': ['SUPER_ADMIN', 'MANAGER']` already covers `/admin/subjects`; no auth.config change required.

---

### `prisma/seed.ts` + `prisma/lib/seed-program.ts` (config, batch)

**Analog:** `prisma/seed.ts` (destructive wipe) + `prisma/lib/seed-program.ts` (level/step creation)

**Wipe order (seed.ts lines 59–64):**
```59:64:prisma/seed.ts
  await prisma.step.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  // ...
  await prisma.level.deleteMany();
```

**Add:** `await prisma.subject.deleteMany()` before or after levels (levels FK → subject). Create subjects first, then levels with `subjectId`.

**Level creation (seed-program.ts lines 37–59):**
```37:59:prisma/lib/seed-program.ts
async function createLevelWithSteps(
  prisma: PrismaClient,
  number: number,
  title: string,
  steps: StepDef[],
) {
  const level = await prisma.level.create({
    data: { number, title },
  });
  for (const step of steps) {
    await prisma.step.create({
      data: { levelId: level.id, order: step.order, title: step.title, ... },
    });
  }
}
```

**Refactor:** `createLevelWithSteps(prisma, subjectId, number, title, steps)`. Seed 3 subjects (D-11):
1. **Коран** — adapt current `loadAllProgramLevelSteps()` / 5 levels
2. **Таджвид** — smaller inline `StepDef[]` (2–3 levels)
3. **Арабский язык** — distinct inline program

Export `seedProgramForSubject(prisma, subjectId, ...)` or parameterize `seedProgram`.

---

### Delete `src/app/(dashboard)/admin/program/**` (route removal)

**Pattern:** hard delete route tree (D-06: no redirect). Grep confirms hardcoded `/admin/program` in:
- `program-actions.ts` revalidatePath
- `LevelsTable.tsx`, `LevelStepsTable.tsx`, `StepForm.tsx`
- `AppShell.tsx`
- `README.md` (docs update optional in same phase)

No `e2e` references to `/admin/program` found.

---

## Shared Patterns

### Authentication (server pages + actions)
**Source:** `src/shared/lib/session.ts`
**Apply to:** all `subject-admin` actions, all `admin/subjects/*` pages, all `program-actions`

```22:25:src/shared/lib/session.ts
export async function requireRoles(roles: Role[]) {
	const session = await requireAuth()
	if (!roles.includes(session.user.role as Role)) redirect('/login')
	return session
}
```

Use `['SUPER_ADMIN', 'MANAGER']` — same order as `program-actions.ts`.

### Server Actions file structure
**Source:** `src/features/groups/actions/group-actions.ts`
**Apply to:** `subject-actions.ts`, `program-actions.ts`

- `'use server'` first line
- `requireRoles` at start of every exported function
- `unknown` input + Zod `.parse()` / `.safeParse()`
- `revalidatePath` after mutations
- Business errors: `throw new Error('сообщение на русском')`

### Admin list page (Server Component)
**Source:** `src/app/(dashboard)/groups/page.tsx`
**Apply to:** `admin/subjects/page.tsx`, `admin/subjects/[subjectId]/program/page.tsx`

1. `await requireRoles(...)`
2. Fetch via server action
3. Map Prisma result → flat row DTO for client component
4. Return client UI component with props only (no hooks in page)

### Client admin table + modal CRUD
**Source:** `src/features/groups/ui/GroupsList.tsx`
**Apply to:** `SubjectsList.tsx`

- `"use client"`
- `useState` for modal open + edit row
- `useRouter().refresh()` on success
- `Modal` with `footer={null} destroyOnHidden`
- `flex flex-col gap-4` page rhythm

### Form submit with pending state
**Source:** `src/features/groups/ui/CreateGroupForm.tsx`
**Apply to:** `CreateSubjectForm`, `EditSubjectForm`

- `useTransition` + `loading={isPending}` on submit button
- Ant Design `Form` vertical layout
- `onSuccess` callback from parent closes modal + refreshes

### Destructive delete confirm
**Source:** `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx`
**Apply to:** `SubjectsList` delete action

- `App.useApp()` → `modal` + `message`
- `okType: 'danger'`, Russian copy from UI-SPEC
- `try/catch` in `onOk` with `message.error` for server thrown errors

### Delete blocked by relations
**Source:** `src/features/user-admin/actions/user-actions.ts` (teacher with groups)
**Apply to:** `deleteSubject`

- Pre-check `_count.levels` (steps implied by cascade from levels)
- `throw new Error` with UI-SPEC message; client shows via `message.error`

### Program step order transactions
**Source:** `src/features/program-admin/actions/program-actions.ts` (lines 12–66, 119–144)
**Apply to:** step create/update — **no changes** to transaction logic in Phase 10

### Path revalidation after program mutations
**Source:** `program-actions.ts`
**Apply to:** all `revalidatePath` calls

Replace flat `/admin/program` with subject-scoped base:
- List: `/admin/subjects/${subjectId}/program`
- Level: `/admin/subjects/${subjectId}/program/${levelId}`
- Also revalidate `/admin/subjects` when level count affects subject list tags

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/shared/lib/student-progress/offsets.ts` (subject scope) | utility | transform | Only global offsets exist; extend in place |
| `prisma/lib/seed-program.ts` (multi-subject) | config | batch | Single global program seed only; refactor needed |
| E2E updates for `/admin/program` | test | — | No e2e references found |

---

## Metadata

**Analog search scope:** `src/features/groups/`, `src/features/program-admin/`, `src/app/(dashboard)/admin/program/`, `src/app/(dashboard)/groups/`, `src/widgets/app-shell/`, `prisma/`, `src/shared/lib/validations/`, `src/shared/lib/student-progress/`, `src/features/extra-assignments/ui/`, `src/features/user-admin/actions/`
**Files scanned:** ~45
**Pattern extraction date:** 2026-07-07
