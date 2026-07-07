# Phase 11: Groups & Enrollment - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 24
**Analogs found:** 22 / 24

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (Group.subjectId + GroupEnrollment) | model | CRUD | `StudentExtraAssignment`, `PostLike` junction | exact |
| `prisma/migrations/*_group_enrollment/migration.sql` | migration | transform | `20260707180000_add_subject/migration.sql` | exact |
| `src/shared/lib/validations/group.ts` | utility | transform | `src/shared/lib/validations/subject.ts` | exact |
| `src/shared/lib/validations/enrollment.ts` | utility | transform | `src/shared/lib/validations/extra-assignment.ts` | role-match |
| `src/shared/lib/validations/enrollment.test.ts` | test | transform | `src/features/subject-admin/actions/subject-actions.test.ts` | role-match |
| `src/features/groups/actions/group-actions.ts` | service | CRUD | same file + `subject-actions.ts` | exact |
| `src/features/groups/ui/GroupsList.tsx` | component | CRUD | same file + `SubjectsList.tsx` (filter) | exact |
| `src/features/groups/ui/CreateGroupForm.tsx` | component | CRUD | same file + subject Select | exact |
| `src/features/groups/ui/EditGroupForm.tsx` | component | CRUD | same file + read-only subject | partial |
| `src/features/groups/ui/GroupStudentsTable.tsx` | component | CRUD | same file + unenroll action | exact |
| `src/features/groups/ui/EnrollStudentModal.tsx` | component | CRUD | `CreateUserForm.tsx` (group+level) | role-match |
| `src/app/(dashboard)/groups/page.tsx` | route | request-response | same file + `admin/subjects/page.tsx` | exact |
| `src/app/(dashboard)/groups/[groupId]/page.tsx` | route | request-response | same file (enrollments mapping) | exact |
| `src/app/api/students/route.ts` | route | request-response | same file (enrollment join) | exact |
| `src/shared/lib/authorize-api-request.ts` | middleware | request-response | same file (GroupEnrollment check) | exact |
| `src/features/user-admin/actions/user-actions.ts` | service | CRUD | same file `createUsers` transaction | exact |
| `src/shared/lib/validations/user.ts` | utility | transform | same file (enrollment via create) | exact |
| `src/features/user-admin/lib/map-users-to-details.ts` | utility | transform | same file (enrollment level) | partial |
| `src/features/student-admin/actions/student-admin-actions.ts` | service | CRUD | same file (levelId → enrollment) | partial |
| `prisma/seed.ts` + `prisma/seed-e2e.ts` | config | batch | Phase 10 seed + `seed-e2e.ts` groupId | partial |
| `e2e/groups-enrollment.spec.ts` | test | request-response | `e2e/admin.spec.ts` + `e2e/extra-assignments.spec.ts` | role-match |
| `e2e/admin.spec.ts` (update) | test | request-response | same file | exact |
| `src/features/journal/actions/journal-actions.ts` | service | request-response | same file (`student.group` → enrollment) | partial |
| `prisma/lib/subject-constants.ts` | config | — | already exists | exact |

## Pattern Assignments

### `prisma/schema.prisma` — Group.subjectId + GroupEnrollment (model, CRUD)

**Analog:** `StudentExtraAssignment` (explicit junction with attributes) + `PostLike` (`@@unique` composite)

**Junction with business attributes (lines 222–239):**
```222:239:prisma/schema.prisma
model StudentExtraAssignment {
  id            String   @id @default(cuid())
  templateId    String
  template      ExtraAssignment @relation(fields: [templateId], references: [id], onDelete: Cascade)
  studentId     String
  student       Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  displayStepId String
  displayStep   Step     @relation("DisplayStepExtraAssignments", fields: [displayStepId], references: [id])
  assignedById  String
  assignedBy    User     @relation("ExtraAssignmentAssignedBy", fields: [assignedById], references: [id])
  createdAt     DateTime @default(now())
  completion    ExtraAssignmentCompletion?

  @@index([sessionId, displayStepId])
  @@index([studentId])
}
```

**Composite unique (lines 554–564):**
```554:564:prisma/schema.prisma
model PostLike {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([postId, userId])
  @@index([postId])
}
```

**Current Group/Student (to replace, lines 120–141):**
```120:141:prisma/schema.prisma
model Group {
  id               String            @id @default(cuid())
  name             String
  teacherId        String
  teacher          Teacher           @relation(fields: [teacherId], references: [id])
  students         Student[]
  teachingSessions TeachingSession[]
}

model Student {
  id             String           @id @default(cuid())
  userId         String           @unique
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName       String?
  phone          String?
  guardianName   String?
  guardianPhone  String?
  groupId        String
  group          Group            @relation(fields: [groupId], references: [id])
  levelId        String
  level          Level            @relation(fields: [levelId], references: [id])
  currentStepIdx Int              @default(0)
```

**Apply:**
- `Group`: add `subjectId String`, `subject Subject @relation(...)`, `enrollments GroupEnrollment[]`; remove `students Student[]`; `@@index([subjectId])`
- `GroupEnrollment`: `studentId`, `groupId`, `levelId`, `enrolledAt`; `@@unique([studentId, groupId])` (no unique by subject — D-10)
- `Student`: remove `groupId`, `levelId`, relations; add `enrollments GroupEnrollment[]`; keep `currentStepIdx` (Phase 12)
- `Subject`: add `groups Group[]`
- `Level`: replace `students Student[]` with `enrollments GroupEnrollment[]`

---

### `prisma/migrations/*_group_enrollment/migration.sql` (migration, transform)

**Analog:** `prisma/migrations/20260707180000_add_subject/migration.sql`

**Prod-safe backfill pattern (lines 16–33):**
```16:33:prisma/migrations/20260707180000_add_subject/migration.sql
-- AlterTable: add nullable subjectId, backfill, then enforce NOT NULL
ALTER TABLE "Level" ADD COLUMN "subjectId" TEXT;

UPDATE "Level" SET "subjectId" = 'clq10defaultquransubject00';

ALTER TABLE "Level" ALTER COLUMN "subjectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "Level_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Level_subjectId_number_key" ON "Level"("subjectId", "number");

-- CreateIndex
CREATE INDEX "Level_subjectId_idx" ON "Level"("subjectId");
```

**Apply for Phase 11 (order):**
1. `ALTER TABLE "Group" ADD COLUMN "subjectId" TEXT` → `UPDATE` with `DEFAULT_QURAN_SUBJECT_ID` from `prisma/lib/subject-constants.ts` → `SET NOT NULL` + FK + index
2. `CREATE TABLE "GroupEnrollment"` with PK, FKs, `@@unique([studentId, groupId])`, indexes
3. `INSERT INTO "GroupEnrollment"` from `Student` where `groupId IS NOT NULL` (copy `levelId`)
4. Drop `Student_groupId_fkey`, `Student_levelId_fkey`, columns `groupId`, `levelId`
5. Regenerate client: `pnpm exec prisma generate`

**Constant for backfill:**
```1:5:prisma/lib/subject-constants.ts
/**
 * Fixed cuid for the default «Коран» subject created during migration backfill.
 * The migration SQL INSERT must use this exact id — do not change without a new migration.
 */
export const DEFAULT_QURAN_SUBJECT_ID = 'clq10defaultquransubject00'
```

---

### `src/shared/lib/validations/group.ts` (utility, transform)

**Analog:** `src/shared/lib/validations/subject.ts`

```1:11:src/shared/lib/validations/subject.ts
import { z } from 'zod'

export const createSubjectSchema = z.object({
	name: z.string().min(2, 'Название должно быть не короче 2 символов'),
	description: z.string().default(''),
})

export const updateSubjectSchema = createSubjectSchema.partial()

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
```

**Group variant:**
- `createGroupSchema`: `name`, `teacherId`, `subjectId: z.string().min(1, 'Выберите предмет')` (D-06)
- `updateGroupSchema`: `name`, `teacherId` only — **no subjectId** (D-07)
- Export `CreateGroupInput`, `UpdateGroupInput`
- Move inline schemas out of `group-actions.ts` into this file (subject-admin pattern)

---

### `src/shared/lib/validations/enrollment.ts` (utility, transform)

**Analog:** `src/shared/lib/validations/extra-assignment.ts` (assign payload) + server-side refine in action

```20:34:src/shared/lib/validations/extra-assignment.ts
export const assignExtraAssignmentSchema = z.object({
	templateId: z.string().min(1),
	studentId: z.string().min(1),
	sessionId: z.string().min(1),
	displayStepId: z.string().min(1),
})

export type AssignExtraAssignmentInput = z.infer<typeof assignExtraAssignmentSchema>
```

**Enrollment variant:**
```typescript
export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Выберите ученика'),
  levelId: z.string().min(1, 'Выберите уровень'),
})

export const unenrollStudentSchema = z.object({
  studentId: z.string().min(1),
})
```

Level ∈ subject validation — **server action only** (Prisma `findFirst`), not Zod refine alone (needs async DB). Unit test can mock the guard function.

---

### `src/shared/lib/validations/enrollment.test.ts` (test, transform)

**Analog:** `src/features/subject-admin/actions/subject-actions.test.ts`

**Vitest mock pattern (lines 1–33):**
```1:33:src/features/subject-admin/actions/subject-actions.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRolesMock = vi.fn()
const subjectFindManyMock = vi.fn()
// ...

vi.mock('@/shared/lib/session', () => ({
	requireRoles: (...args: unknown[]) => requireRolesMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		subject: {
			findMany: (...args: unknown[]) => subjectFindManyMock(...args),
			// ...
		},
	},
}))
```

**Test cases:**
- `enrollStudentSchema` rejects empty `levelId`
- `enrollStudent` throws when level.subjectId ≠ group.subjectId (mock `group.findUnique` + `level.findFirst`)

---

### `src/features/groups/actions/group-actions.ts` (service, CRUD)

**Analog:** same file + `subject-actions.ts` (shared Zod) + enrollment pattern from RESEARCH Pattern 3

**Current list + create (lines 9–78):**
```9:28:src/features/groups/actions/group-actions.ts
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

**Refactor map:**

| Function | Change |
|----------|--------|
| `getGroups()` | `include: { subject: true }`, `_count: { select: { enrollments: true } }` |
| `getGroup(groupId)` | Replace `students` with `enrollments: { include: { student: { include: { user: true } }, level: true } }` |
| `getMyGroup()` | Same enrollment include (teacher view) |
| `createGroup()` | Import `createGroupSchema` from `validations/group.ts`; data includes `subjectId` |
| `updateGroup()` | No `subjectId` in schema (D-07) |
| `enrollStudent(groupId, input)` | **New** — parse `enrollStudentSchema`, verify level ∈ group.subject, `groupEnrollment.create`, revalidate `/groups/${groupId}`, `/groups`, `/journal` |
| `unenrollStudent(groupId, studentId)` | **New** — `groupEnrollment.delete` where `@@unique([studentId, groupId])` |
| `searchStudentsForEnroll(query?)` | **New** — `prisma.student.findMany` with `user.name` search; exclude already enrolled in this group |
| `getGroupLevels(groupId)` | **New** — load group.subjectId → delegate to `getLevels(subjectId)` pattern |

**Enrollment core (mirror `createUsers` transaction guard):**
```typescript
const group = await prisma.group.findUnique({
  where: { id: groupId },
  select: { subjectId: true },
})
if (!group) throw new Error('Группа не найдена')

const level = await prisma.level.findFirst({
  where: { id: data.levelId, subjectId: group.subjectId },
})
if (!level) throw new Error('Уровень не принадлежит предмету группы')

await prisma.groupEnrollment.create({
  data: { studentId: data.studentId, groupId, levelId: data.levelId },
})
```

**Subject list for forms:** import `getSubjects()` from `subject-actions.ts` — do not duplicate query.

---

### `src/features/groups/ui/GroupsList.tsx` (component, CRUD)

**Analog:** same file + subject column/filter from `UsersTable.tsx`

**Current table (lines 25–68):**
```25:68:src/features/groups/ui/GroupsList.tsx
export function GroupsList({ groups, teachers }: GroupsListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      // ...
      <Table
        dataSource={groups}
        rowKey="id"
        columns={[
          { title: "Название", ... },
          { title: "Учитель", ... },
          { title: "Учеников", ... },
          { title: "Действия", ... },
        ]}
      />
```

**Subject filter analog** (`UsersTable.tsx` lines 197–204):
```197:204:src/features/user-admin/ui/UsersTable.tsx
            {
              title: "Группа",
              dataIndex: "groupName",
              key: "groupName",
              filters: groupFilters,
              filterSearch: true,
              onFilter: (value: boolean | Key, record: UserDetail) =>
                matchesGroupFilter(record, String(value)),
```

**Apply:**
- Extend `GroupRow`: `subjectId`, `subjectName`
- New column «Предмет» (`Tag` or plain text)
- Column filter: `filters: subjects.map(s => ({ text: s.name, value: s.id }))`, `onFilter: (_, r) => r.subjectId === value`
- Pass `subjects: { id, name }[]` prop from page
- Extend `editGroup` state with `subjectName` for read-only display in `EditGroupForm`

---

### `src/features/groups/ui/CreateGroupForm.tsx` (component, CRUD)

**Analog:** same file + subject `Select` (like `teacherId` Select)

**Current pattern (lines 13–37):**
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
			<Form.Item name="teacherId" label="Учитель" rules={[{ required: true }]}>
				<Select options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
			</Form.Item>
```

**Add:**
- Prop `subjects: { id: string; name: string }[]`
- `Form.Item name="subjectId" label="Предмет"` with `Select` — **first field** (D-06, D-09)
- Extend `onFinish` values type with `subjectId`
- No level picker on group form (D-09)

---

### `src/features/groups/ui/EditGroupForm.tsx` (component, CRUD)

**Analog:** same file + read-only subject display

**Current pattern (lines 33–59):**
```33:59:src/features/groups/ui/EditGroupForm.tsx
	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={{ name: initialName, teacherId: initialTeacherId }}
			onFinish={onFinish}
		>
			<Form.Item name="name" label="Название" ...>
				<Input />
			</Form.Item>
			<Form.Item name="teacherId" label="Учитель" ...>
				<Select ... />
			</Form.Item>
```

**Add:**
- Prop `subjectName: string`
- Read-only `Form.Item label="Предмет"` with `<Input value={subjectName} disabled />` — not in submit payload (D-07)
- Do not include `subjectId` in `updateGroup` call

---

### `src/features/groups/ui/GroupStudentsTable.tsx` (component, CRUD)

**Analog:** same file + `SubjectsList` delete confirm + enroll CTA

**Current level column (lines 133–137):**
```133:137:src/features/groups/ui/GroupStudentsTable.tsx
      {
        title: "Уровень",
        key: "levelTitle",
        render: (_, record) => record.student?.levelTitle ?? "—",
      },
```

**Apply:**
- Add props: `groupId`, `subjectId`, `onEnrollClick`, `canManageEnrollment` (manager/admin)
- Header row: `Button type="primary"` «Добавить ученика» → opens `EnrollStudentModal` (D-02)
- Level column: show enrollment `levelTitle` (mapped from enrollment, not `student.levelId`)
- Optional actions column: «Снять с группы» with `App.useApp().modal.confirm` (pattern from `SubjectsList.tsx` lines 41–60)
- `readOnly` on `UserDetailModal` for group/level fields (D-02) — enrollment only on this page
- Keep «Текущий шаг» from `currentStepIdx` (known Phase 12 limitation)

**Delete confirm analog** (`SubjectsList.tsx`):
```41:60:src/features/subject-admin/ui/SubjectsList.tsx
		modal.confirm({
			title: 'Удалить предмет?',
			content: `Предмет «${record.name}» будет удалён безвозвратно.`,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				try {
					await deleteSubject(record.id)
					message.success('Предмет удалён')
					router.refresh()
				} catch (err) {
					message.error(
						err instanceof Error
							? err.message
							: 'Не удалось сохранить. Попробуйте ещё раз.',
					)
				}
			},
		})
```

---

### `src/features/groups/ui/EnrollStudentModal.tsx` (component, CRUD) — NEW

**Analog:** `CreateUserForm.tsx` (group + level Select) + `GroupStudentsTable` name search filter

**Student + level Select pattern** (`CreateUserForm.tsx` lines 203–230):
```203:230:src/features/user-admin/ui/CreateUserForm.tsx
					<Controller
						name="groupId"
						control={control}
						render={({ field, fieldState }) => (
							<Form.Item
								label="Группа"
								validateStatus={fieldState.error ? 'error' : ''}
								help={fieldState.error?.message}
							>
								<Select
									{...field}
									options={groups.map((g) => ({ value: g.id, label: g.name }))}
								/>
							</Form.Item>
						)}
					/>
```

**Apply:**
- Props: `groupId`, `subjectId`, `open`, `onClose`, `onSuccess`
- `Select` student: `showSearch`, `optionFilterProp="label"`, options from server action `searchStudentsForEnroll` (all students, D-03)
- `Select` level: options from `getLevels(subjectId)` — subject-scoped (D-04)
- Submit: `enrollStudent(groupId, { studentId, levelId })` via `useTransition`
- `App.useApp().message.success('Ученик зачислен')` on success
- Use Ant Design `Form` (like `CreateGroupForm`) — not react-hook-form unless validation complex

---

### `src/app/(dashboard)/groups/page.tsx` (route, request-response)

**Analog:** same file + subjects fetch from `admin/subjects/page.tsx`

**Current (lines 1–22):**
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
		teacherId: g.teacherId,
		teacherName: g.teacher.user.name,
		studentCount: g._count.students,
	}))

	return (
		<GroupsList
			groups={rows}
			teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
		/>
	)
}
```

**Add:**
- `getSubjects()` from `subject-actions.ts` in `Promise.all`
- Map `subjectId`, `subjectName: g.subject.name`, `studentCount: g._count.enrollments`
- Pass `subjects` to `GroupsList` for filter

---

### `src/app/(dashboard)/groups/[groupId]/page.tsx` (route, request-response)

**Analog:** same file — swap `group.students` → enrollments

**Current student mapping (lines 17–54):**
```17:54:src/app/(dashboard)/groups/[groupId]/page.tsx
  const [groups, levels, { group }] = await Promise.all([
    prisma.group.findMany({ select: { id: true, name: true } }),
    getLevelsForCreateUser(),
    getGroup(groupId),
  ]);

  // ...
  const studentUsers = group.students.map((student) => ({
    ...student.user,
    student: {
      ...student,
      group: { name: group.name },
    },
  }));

  const users = mapUsersToDetails(studentUsers, levelOptions);
```

**Apply:**
- Replace `getLevelsForCreateUser()` with `getLevels(group.subjectId)` from `program-actions.ts`
- Map enrollments:
```typescript
const studentUsers = group.enrollments.map((e) => ({
  ...e.student.user,
  student: {
    ...e.student,
    levelId: e.levelId,        // from enrollment
    level: e.level,
    group: { name: group.name },
  },
}))
```
- Pass `groupId`, `subjectId` to `GroupStudentsTable`
- Render `EnrollStudentModal` sibling or inside table

---

### `src/app/api/students/route.ts` (route, request-response)

**Analog:** same file — enrollment join (RESEARCH Pattern 4)

**Current query (lines 26–48):**
```26:48:src/app/api/students/route.ts
	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			students: {
				include: {
					user: true,
					level: true,
					sessions: dayRange ? { ... } : false,
				},
			},
		},
	})

	if (!group) return error('Группа не найдена', 404)

	const students = group.students
```

**Apply:**
```typescript
enrollments: {
  include: {
    student: {
      include: {
        user: true,
        sessions: dayRange ? { ... } : false,
      },
    },
    level: true,
  },
}

const students = group.enrollments
  .map((e) => ({ student: e.student, level: e.level }))
  .filter(({ student }) => isJournalVisibleStatus(student.status))
  .map(({ student, level }) => ({
    // ...
    levelNumber: level.number,
    levelTitle: level.title,
    // remove groupId from student — use param groupId
  }))
```

Keep `authorizeApiRequest` with `context: { groupId }` — update auth layer separately.

---

### `src/shared/lib/authorize-api-request.ts` (middleware, request-response)

**Analog:** same file — replace `student.groupId` check

**Current STUDENT + groupId (lines 48–54):**
```48:54:src/shared/lib/authorize-api-request.ts
		if (ctx.groupId) {
			const own = await prisma.student.findUnique({
				where: { id: actorStudentId! },
				select: { groupId: true },
			})
			if (!own || own.groupId !== ctx.groupId) return { error: forbidden() }
		}
```

**Replace with:**
```typescript
const enrollment = await prisma.groupEnrollment.findUnique({
  where: { studentId_groupId: { studentId: actorStudentId!, groupId: ctx.groupId } },
})
if (!enrollment) return { error: forbidden() }
```

**Teacher paths** (lines 57–84): replace `student.group` / `completion.student.group` with enrollment-based group lookup — `group.findUnique({ where: { id: ctx.groupId } })` for teacher access (unchanged), but `studentId` path needs `enrollments: { include: { group: true } }` and pick matching group or first enrollment's group for teacher check.

---

### `src/features/user-admin/actions/user-actions.ts` — `createUsers` (service, CRUD)

**Analog:** same file transaction (lines 93–139)

**Current STUDENT create (lines 99–107):**
```99:107:src/features/user-admin/actions/user-actions.ts
						student: {
							create: {
								fullName: entry.fullName ?? entry.name,
								phone: entry.phone,
								guardianName: entry.guardianName,
								guardianPhone: entry.guardianPhone,
								groupId: data.groupId!,
								levelId: level.id,
								currentStepIdx,
							},
						},
```

**Apply (Pattern 5 from RESEARCH):**
- `student.create` without `groupId`/`levelId`
- After user create, if `data.groupId && level`:
  - Load `group.subjectId`
  - Verify `level.subjectId === group.subjectId`
  - `tx.groupEnrollment.create({ studentId, groupId, levelId })`
- Replace `getLevelsForCreateUser()` with subject-scoped helper or accept `subjectId` from selected group
- `revalidatePath` for `/groups/${groupId}` when enrollment created

---

### `src/shared/lib/validations/user.ts` (utility, transform)

**Analog:** same file — keep groupId+levelId for bulk STUDENT create (creates enrollment)

**Current refines (lines 99–106):**
```99:106:src/shared/lib/validations/user.ts
	.refine((data) => data.role !== 'STUDENT' || !!data.groupId, {
		message: 'Выберите группу',
		path: ['groupId'],
	})
	.refine((data) => data.role !== 'STUDENT' || !!data.levelId, {
		message: 'Выберите уровень',
		path: ['levelId'],
	})
```

**Apply:**
- Keep refines for `createUserFormSchema` / `createUsersSchema` (A4 — admin UX unchanged)
- `updateStudentUserSchema`: remove `groupId`/`levelId` (D-02 — profile edit only)
- `updateStudentUserFormSchema`: same removal

---

### `src/features/user-admin/lib/map-users-to-details.ts` (utility, transform)

**Analog:** same file — enrollment-sourced levelId

**Current level lookup (lines 48–50):**
```48:50:src/features/user-admin/lib/map-users-to-details.ts
		const studentLevel = user.student
			? levels.find((level) => level.id === user.student!.levelId)
			: undefined
```

**Apply:** No structural change if caller passes enrollment `levelId` on `student` object (group detail page mapping). For multi-group students in `UsersTable`, consider `groupName` from primary enrollment or comma-separated — planner discretion; minimal path: show first enrollment or «N групп».

---

### `src/features/student-admin/actions/student-admin-actions.ts` (service, CRUD)

**Analog:** same file — partial match (tech debt until Phase 12)

**Current (grep):** uses `student.levelId`, `student.groupId` for progress update and `revalidatePath(`/groups/${student.groupId}`)`.

**Minimal Phase 11 fix:**
- Progress update (`updateStudentProgress`) may keep global `currentStepIdx` on `Student`
- Remove direct `student.levelId` updates OR update specific enrollment if `groupId` passed — **defer full fix to Phase 12**; document as known limitation
- `revalidatePath` for all groups student is enrolled in via `enrollments.map(e => e.groupId)`

---

### `prisma/seed.ts` + `prisma/seed-e2e.ts` (config, batch)

**Analog:** Phase 10 seed pattern + `seed-e2e.ts` line 241 `groupId`

**Apply:**
- `seed.ts`: create groups with `subjectId: DEFAULT_QURAN_SUBJECT_ID`; create `GroupEnrollment` instead of `Student.groupId`/`levelId`
- `seed-e2e.ts`: replace `groupId` on student create with `groupEnrollment.create`
- Wipe order: add `groupEnrollment.deleteMany()` before `student.deleteMany()`

---

### `e2e/groups-enrollment.spec.ts` (test, request-response) — NEW

**Analog:** `e2e/admin.spec.ts` + role guards from `e2e/extra-assignments.spec.ts`

**Admin create student (lines 75–80):**
```75:80:e2e/admin.spec.ts
  test("создаёт нового ученика", async ({ page }) => {
    const studentName = `Ученик E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Создать пользователя" }).click();
    const createDialog = page.getByRole("dialog", { name: "Создать пользователя" });
```

**Role guard (extra-assignments lines 23–30):**
```23:30:e2e/extra-assignments.spec.ts
  test("STUDENT не видит страницу справочника", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.studentAli,
    });
    const page = await context.newPage();
    await page.goto("/extra-assignments");
    await expect(page).not.toHaveURL(/\/extra-assignments/);
```

**Scenarios (SUBJ-05..07):**
- Manager: create group with subject (Select `.ant-select[name="subjectId"]`)
- Edit group: subject field disabled
- Enroll student on `/groups/[id]` with level picker
- Student in two groups same subject
- Subject column + filter on `/groups`
- TEACHER cannot access `/groups` (if restricted)

Use `TEST_USERS` / `TEST_CODES` from `e2e/helpers/codes.ts`; unique names with `Date.now()`.

---

## Shared Patterns

### Authentication (server actions + pages)
**Source:** `src/shared/lib/session.ts`
**Apply to:** all `group-actions`, enrollment actions, group pages

```typescript
await requireRoles(['MANAGER', 'SUPER_ADMIN'])
```

Same order as existing `group-actions.ts`.

### Server Actions file structure
**Source:** `src/features/groups/actions/group-actions.ts` + `subject-actions.ts`
**Apply to:** extended `group-actions.ts`

- `'use server'` first line
- Import shared Zod from `src/shared/lib/validations/group.ts` and `enrollment.ts`
- `unknown` input + `.parse()`
- `revalidatePath` after mutations: `/groups`, `/groups/${groupId}`, `/journal`, `/my-group`
- Business errors: `throw new Error('сообщение на русском')`

### Explicit junction table
**Source:** `StudentExtraAssignment` + `PostLike`
**Apply to:** `GroupEnrollment` model

- `@id @default(cuid())`, `createdAt`/`enrolledAt`
- `onDelete: Cascade` on student/group side; `Restrict` on level
- `@@unique([studentId, groupId])` — no duplicate enrollment in same group
- **No** `@@unique([studentId, subjectId])` — D-10

### Prod-safe migration
**Source:** `20260707180000_add_subject/migration.sql`
**Apply to:** `*_group_enrollment/migration.sql`

- ADD COLUMN nullable → UPDATE backfill → SET NOT NULL → FK → indexes
- CREATE TABLE junction → INSERT from legacy columns → DROP old columns
- Use `DEFAULT_QURAN_SUBJECT_ID` constant in SQL
- Local: `pnpm db:migrate -- --name group_enrollment`; prod: `pnpm db:migrate:deploy` only

### Subject-scoped levels
**Source:** `program-actions.ts` `getLevels(subjectId)`

```73:79:src/features/program-admin/actions/program-actions.ts
export async function getLevels(subjectId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findMany({
		where: { subjectId },
		include: { _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})
}
```

**Apply to:** `EnrollStudentModal`, group detail page, `createUsers` level validation.

### Admin list page (Server Component)
**Source:** `src/app/(dashboard)/groups/page.tsx`
**Apply to:** both group pages

1. `await requireRoles(...)`
2. `Promise.all` for parallel fetches
3. Map Prisma → flat DTO
4. Pass props to client components

### Client admin table + modal CRUD
**Source:** `GroupsList.tsx` + `SubjectsList.tsx`
**Apply to:** `GroupsList`, `GroupStudentsTable`, `EnrollStudentModal`

- `"use client"`
- `useState` for modals
- `useRouter().refresh()` on success
- `Modal` with `footer={null} destroyOnHidden`
- `App.useApp()` for `modal.confirm` and `message` — **never** static `Modal.confirm` / `message` from antd import

### Form submit with pending state
**Source:** `CreateGroupForm.tsx`
**Apply to:** `EnrollStudentModal`, updated create/edit forms

- `useTransition` + `loading={isPending}` on submit
- Ant Design `Form` vertical layout

### API route auth + response
**Source:** `src/app/api/students/route.ts`
**Apply to:** journal read adapter

- `authorizeApiRequest({ allowedRoles, context: { groupId } })`
- `success()` / `error()` from `@/shared/api`
- Enrollment join for student list

### Level ∈ subject server guard
**Source:** RESEARCH Pattern 3 + `createUsers` level lookup
**Apply to:** `enrollStudent`, `createUsers` enrollment branch

Always `prisma.level.findFirst({ where: { id: levelId, subjectId: group.subjectId } })` — never trust client Select alone.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `EnrollStudentModal.tsx` | component | CRUD | No dedicated enroll modal; compose from `CreateUserForm` Select + `GroupStudentsTable` search |
| `student-admin` progress per enrollment | service | CRUD | Global `currentStepIdx` only; Phase 12 adds per-subject progress |
| `e2e/groups-enrollment.spec.ts` | test | — | New spec file; patterns from `admin.spec.ts` |

---

## Metadata

**Analog search scope:** `src/features/groups/`, `src/features/subject-admin/`, `src/features/user-admin/`, `src/features/program-admin/`, `src/app/(dashboard)/groups/`, `src/app/api/students/`, `src/shared/lib/validations/`, `src/shared/lib/authorize-api-request.ts`, `prisma/schema.prisma`, `prisma/migrations/20260707180000_add_subject/`, `.planning/phases/10-subject-foundation/10-PATTERNS.md`
**Files scanned:** ~55
**Pattern extraction date:** 2026-07-07
