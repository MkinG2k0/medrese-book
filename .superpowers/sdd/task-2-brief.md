### Task 2: Zod-РІР°Р»РёРґР°С†РёСЏ session

**Files:**
- Modify: `src/shared/lib/validations/session.ts`
- Modify: `src/shared/lib/validations/session.test.ts`

**Interfaces:**
- Consumes: Task 1 fields
- Produces: `CreateSessionInput` СЃ `absenceExcused?: boolean`, `absenceReason?: string | null`; РїРѕСЃР»Рµ parse РїСЂРё РЅРµ-ABSENT РѕР±Р° СЃР±СЂРѕС€РµРЅС‹

- [ ] **Step 1: Write failing tests**

Р”РѕР±Р°РІРёС‚СЊ РІ `session.test.ts`:

```ts
it('РїСЂРёРЅРёРјР°РµС‚ ABSENT СЃ absenceExcused Рё absenceReason', () => {
  const result = createSessionSchema.safeParse({
    studentId: 'student-1',
    groupId: 'group-1',
    date: '2026-07-11',
    attendance: 'ABSENT',
    absenceExcused: true,
    absenceReason: 'Р‘РѕР»РµР·РЅСЊ',
    completions: [],
  })
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.absenceExcused).toBe(true)
    expect(result.data.absenceReason).toBe('Р‘РѕР»РµР·РЅСЊ')
  }
})

it('РїСЂРё PRESENT СЃР±СЂР°СЃС‹РІР°РµС‚ absenceExcused Рё absenceReason', () => {
  const result = createSessionSchema.safeParse({
    studentId: 'student-1',
    groupId: 'group-1',
    date: '2026-07-11',
    attendance: 'PRESENT',
    absenceExcused: true,
    absenceReason: 'РЅРµ РґРѕР»Р¶РЅРѕ СЃРѕС…СЂР°РЅРёС‚СЊСЃСЏ',
    completions: [],
  })
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.absenceExcused).toBe(false)
    expect(result.data.absenceReason).toBeNull()
  }
})

it('РїСѓСЃС‚СѓСЋ РїСЂРёС‡РёРЅСѓ РЅРѕСЂРјР°Р»РёР·СѓРµС‚ РІ null', () => {
  const result = createSessionSchema.safeParse({
    studentId: 'student-1',
    groupId: 'group-1',
    date: '2026-07-11',
    attendance: 'ABSENT',
    absenceExcused: false,
    absenceReason: '   ',
    completions: [],
  })
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.absenceReason).toBeNull()
  }
})
```

- [ ] **Step 2: Run tests вЂ” expect FAIL**

```bash
pnpm test:unit src/shared/lib/validations/session.test.ts
```

Expected: FAIL (РЅРµС‚ РїРѕР»РµР№ / РЅРµС‚ transform).

- [ ] **Step 3: Implement schema**

Р—Р°РјРµРЅРёС‚СЊ `createSessionSchema` РЅР°:

```ts
import { z } from 'zod'

export const createSessionSchema = z
  .object({
    studentId: z.string(),
    groupId: z.string().min(1, 'groupId РѕР±СЏР·Р°С‚РµР»РµРЅ'),
    date: z.string().datetime().or(z.string().date()),
    attendance: z.enum(['PRESENT', 'LATE', 'ABSENT']),
    lateMinutes: z.number().int().min(0).optional().nullable(),
    note: z.string().optional().nullable(),
    absenceExcused: z.boolean().optional().default(false),
    absenceReason: z.string().optional().nullable(),
    completions: z
      .array(
        z.object({
          stepId: z.string(),
          grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
          note: z.string().optional().nullable(),
        }),
      )
      .default([]),
  })
  .transform((data) => {
    if (data.attendance !== 'ABSENT') {
      return {
        ...data,
        absenceExcused: false,
        absenceReason: null,
      }
    }
    const reason = data.absenceReason?.trim() || null
    return {
      ...data,
      absenceExcused: data.absenceExcused ?? false,
      absenceReason: reason,
    }
  })

export type CreateSessionInput = z.infer<typeof createSessionSchema>
```

- [ ] **Step 4: Run tests вЂ” expect PASS**

```bash
pnpm test:unit src/shared/lib/validations/session.test.ts
```

Expected: PASS.

---
