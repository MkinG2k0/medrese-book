# Уважительные пропуски — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** При прогуле учитель отмечает уважительность и опциональную причину; в аналитике «Требуют внимания» пропуски показаны двумя бейджами; риск считает только неуважительные.

**Architecture:** Два поля на `Session` (`absenceExcused`, `absenceReason`). Журнал передаёт их через `POST /api/sessions`. Метрики at-risk фильтруют `ABSENT && !absenceExcused` для риска и считают `excusedAbsencesInMonth` отдельно. UI аналитики — одна колонка с красным/жёлтым `Tag`.

**Tech Stack:** Prisma 7 + PostgreSQL, Zod, Next.js App Router API, React Query, Ant Design, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-30-excused-absence-reason-design.md`

## Global Constraints

- UI и сообщения на русском
- Миграции только безопасные `ADD COLUMN` (prod Dokploy)
- Не использовать `Session.note` для причины пропуска
- Layout: не добавлять новый `<Flex>` из antd (Tailwind `div`); при правке `AttendanceButtons` заменить существующий `Flex` на `div`
- Статические `Modal`/`message` из antd запрещены — только `App.useApp()`
- Коммиты — только если пользователь явно попросил; иначе оставлять изменения незакоммиченными

## File map

| File | Role |
|------|------|
| `prisma/schema.prisma` | Поля `absenceExcused`, `absenceReason` на `Session` |
| `prisma/migrations/...` | SQL ADD COLUMN |
| `src/shared/lib/validations/session.ts` | Zod + нормализация при не-ABSENT |
| `src/shared/lib/validations/session.test.ts` | Тесты схемы |
| `src/shared/lib/student-metrics/attendance-risk.ts` | Подсчёт неуваж./уваж.; риск только неуваж. |
| `src/shared/lib/student-metrics/attendance-risk.test.ts` | Unit-тесты |
| `src/shared/lib/student-metrics/types.ts` | `excusedAbsencesInMonth` в `AtRiskStudentRow` |
| `src/shared/lib/student-metrics/load-student-metrics.ts` | select + count excused |
| `src/shared/lib/analytics-queries/at-risk-students.ts` | Проброс поля |
| `src/shared/lib/analytics-queries/level-stats.ts` | `totalAbsences` только неуваж. |
| `src/shared/lib/analytics-queries/top-students.ts` | `absences` только неуваж. |
| `src/app/api/sessions/route.ts` | Persist новых полей |
| `src/features/journal/lib/get-student-session.ts` | Read/serialize |
| `src/entities/session/api/use-sessions.ts` | Типы клиента |
| `src/features/journal/ui/AttendanceButtons.tsx` | UI excused + reason |
| `src/features/journal/model/use-lesson-page.ts` | State + save payload |
| `src/features/journal/ui/lesson/LessonStepsSection.tsx` | Props wiring |
| `src/features/journal/ui/LessonPage.tsx` | Props wiring (если нужно) |
| `src/features/analytics/ui/AtRiskStudentsTable.tsx` | Бейджи в колонке |
| `e2e/excused-absence.spec.ts` | E2E happy path |

---

### Task 1: Prisma — поля на Session

**Files:**
- Modify: `prisma/schema.prisma` (model `Session`)
- Create: `prisma/migrations/<timestamp>_session_absence_excused/migration.sql`
- Test: `pnpm exec prisma validate`

**Interfaces:**
- Produces: `Session.absenceExcused: boolean` (default `false`), `Session.absenceReason: string | null`

- [ ] **Step 1: Добавить поля в schema**

В `model Session` после `note`:

```prisma
  note             String?
  absenceExcused   Boolean          @default(false)
  absenceReason    String?
  isAdjustment     Boolean          @default(false)
```

- [ ] **Step 2: Создать миграцию**

Локально (docker postgres / безопасный DATABASE_URL):

```bash
pnpm db:migrate -- --name session_absence_excused
```

Если DATABASE_URL указывает на test/prod — только файл:

```bash
pnpm db:migrate -- --create-only --name session_absence_excused
```

SQL должен быть только:

```sql
ALTER TABLE "Session" ADD COLUMN "absenceExcused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "absenceReason" TEXT;
```

- [ ] **Step 3: Generate client**

```bash
pnpm exec prisma generate
```

Expected: успех, без ошибок.

- [ ] **Step 4: Validate**

```bash
pnpm exec prisma validate
```

Expected: schema is valid.

---

### Task 2: Zod-валидация session

**Files:**
- Modify: `src/shared/lib/validations/session.ts`
- Modify: `src/shared/lib/validations/session.test.ts`

**Interfaces:**
- Consumes: Task 1 fields
- Produces: `CreateSessionInput` с `absenceExcused?: boolean`, `absenceReason?: string | null`; после parse при не-ABSENT оба сброшены

- [ ] **Step 1: Write failing tests**

Добавить в `session.test.ts`:

```ts
it('принимает ABSENT с absenceExcused и absenceReason', () => {
  const result = createSessionSchema.safeParse({
    studentId: 'student-1',
    groupId: 'group-1',
    date: '2026-07-11',
    attendance: 'ABSENT',
    absenceExcused: true,
    absenceReason: 'Болезнь',
    completions: [],
  })
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.absenceExcused).toBe(true)
    expect(result.data.absenceReason).toBe('Болезнь')
  }
})

it('при PRESENT сбрасывает absenceExcused и absenceReason', () => {
  const result = createSessionSchema.safeParse({
    studentId: 'student-1',
    groupId: 'group-1',
    date: '2026-07-11',
    attendance: 'PRESENT',
    absenceExcused: true,
    absenceReason: 'не должно сохраниться',
    completions: [],
  })
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.absenceExcused).toBe(false)
    expect(result.data.absenceReason).toBeNull()
  }
})

it('пустую причину нормализует в null', () => {
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

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm test:unit src/shared/lib/validations/session.test.ts
```

Expected: FAIL (нет полей / нет transform).

- [ ] **Step 3: Implement schema**

Заменить `createSessionSchema` на:

```ts
import { z } from 'zod'

export const createSessionSchema = z
  .object({
    studentId: z.string(),
    groupId: z.string().min(1, 'groupId обязателен'),
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

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test:unit src/shared/lib/validations/session.test.ts
```

Expected: PASS.

---

### Task 3: attendance-risk — неуваж. vs уваж.

**Files:**
- Modify: `src/shared/lib/student-metrics/attendance-risk.ts`
- Modify: `src/shared/lib/student-metrics/attendance-risk.test.ts`
- Modify: `src/shared/lib/student-metrics/index.ts` (если нужен реэкспорт)

**Interfaces:**
- Consumes: `SessionInput` с `absenceExcused?: boolean` (default treat missing as `false`)
- Produces:
  - `countStudentAbsencesInMonth` — только неуважительные
  - `countStudentExcusedAbsencesInMonth(sessions, monthRange): number`
  - `evaluateAttendanceRisk` — streak и месяц только по неуважительным

- [ ] **Step 1: Write failing tests**

Добавить в `attendance-risk.test.ts`:

```ts
import {
  countStudentAbsencesInMonth,
  countStudentExcusedAbsencesInMonth,
  evaluateAttendanceRisk,
} from './attendance-risk'

it('не считает уважительные пропуски в пороге риска', () => {
  const result = evaluateAttendanceRisk({
    sessions: [
      {
        date: new Date('2026-01-01T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: true,
      },
      {
        date: new Date('2026-01-05T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: true,
      },
      {
        date: new Date('2026-01-10T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: true,
      },
    ],
    monthRange,
    config: AT_RISK_CONFIG,
  })
  expect(result).toBe(false)
})

it('прерывает streak уважительным пропуском', () => {
  const result = evaluateAttendanceRisk({
    sessions: [
      {
        date: new Date('2026-01-01T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: false,
      },
      {
        date: new Date('2026-01-02T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: true,
      },
      {
        date: new Date('2026-01-03T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: false,
      },
      {
        date: new Date('2026-01-04T10:00:00.000Z'),
        attendance: 'ABSENT',
        isAdjustment: false,
        absenceExcused: false,
      },
    ],
    monthRange,
    config: AT_RISK_CONFIG,
  })
  // 2 неуваж. подряд после break — ниже порога 3
  expect(result).toBe(false)
})

it('разделяет счётчики неуваж. и уваж.', () => {
  const sessions = [
    {
      date: new Date('2026-01-01T10:00:00.000Z'),
      attendance: 'ABSENT',
      isAdjustment: false,
      absenceExcused: false,
    },
    {
      date: new Date('2026-01-02T10:00:00.000Z'),
      attendance: 'ABSENT',
      isAdjustment: false,
      absenceExcused: true,
    },
    {
      date: new Date('2026-01-03T10:00:00.000Z'),
      attendance: 'ABSENT',
      isAdjustment: false,
      absenceExcused: true,
    },
  ]
  expect(countStudentAbsencesInMonth(sessions, monthRange)).toBe(1)
  expect(countStudentExcusedAbsencesInMonth(sessions, monthRange)).toBe(2)
})
```

Обновить существующие фикстуры: либо не передавать `absenceExcused` (default false), либо явно `false` — поведение старых тестов не должно сломаться.

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test:unit src/shared/lib/student-metrics/attendance-risk.test.ts
```

- [ ] **Step 3: Implement**

Обновить `attendance-risk.ts`:

```ts
type SessionInput = {
  date: Date
  attendance: string
  isAdjustment: boolean
  absenceExcused?: boolean
}

function isUnexcusedAbsent(session: SessionInput): boolean {
  return (
    session.isAdjustment === countableSessionWhere.isAdjustment &&
    session.attendance === 'ABSENT' &&
    !session.absenceExcused
  )
}

function isExcusedAbsent(session: SessionInput): boolean {
  return (
    session.isAdjustment === countableSessionWhere.isAdjustment &&
    session.attendance === 'ABSENT' &&
    Boolean(session.absenceExcused)
  )
}

// countAbsencesInMonth → использовать isUnexcusedAbsent вместо isCountableAbsentSession

// в maxConsecutiveAbsences: streak только если isUnexcusedAbsent; иначе currentStreak = 0
// (уважительный ABSENT и PRESENT/LATE сбрасывают streak)

export function countStudentExcusedAbsencesInMonth(
  sessions: SessionInput[],
  monthRange: { gte: Date; lte: Date },
): number {
  return sessions.filter(
    (session) =>
      isExcusedAbsent(session) && isInDateRange(session.date, monthRange),
  ).length
}
```

Реэкспорт из `src/shared/lib/student-metrics/index.ts` при необходимости.

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test:unit src/shared/lib/student-metrics/attendance-risk.test.ts
```

---

### Task 4: Метрики at-risk + LevelStats/TopStudents

**Files:**
- Modify: `src/shared/lib/student-metrics/types.ts`
- Modify: `src/shared/lib/student-metrics/load-student-metrics.ts`
- Modify: `src/shared/lib/analytics-queries/at-risk-students.ts`
- Modify: `src/shared/lib/analytics-queries/at-risk-students.test.ts` (добавить `excusedAbsencesInMonth` в фикстуры)
- Modify: `src/shared/lib/analytics-queries/level-stats.ts`
- Modify: `src/shared/lib/analytics-queries/top-students.ts`
- Modify: `src/shared/lib/analytics-queries/top-students.test.ts` / level-stats tests если есть

**Interfaces:**
- Produces: `AtRiskStudentRow.excusedAbsencesInMonth: number`
- Produces: `StudentMetricsBundle.excusedAbsencesInMonth: number`

- [ ] **Step 1: Обновить типы**

В `AtRiskStudentRow`:

```ts
absencesInMonth: number
excusedAbsencesInMonth: number
```

В `StudentMetricsBundle` (load-student-metrics):

```ts
absencesInMonth: number
excusedAbsencesInMonth: number
```

- [ ] **Step 2: load-student-metrics — select + count**

В `sessions.select` добавить `absenceExcused: true`.

В `computeMetricsForEnrollment`:

```ts
import {
  countStudentAbsencesInMonth,
  countStudentExcusedAbsencesInMonth,
  evaluateAttendanceRisk,
} from './attendance-risk'

const absencesInMonth = countStudentAbsencesInMonth(student.sessions, monthRange)
const excusedAbsencesInMonth = countStudentExcusedAbsencesInMonth(
  student.sessions,
  monthRange,
)
// return { ..., absencesInMonth, excusedAbsencesInMonth }
```

В `at-risk-students.ts` пробросить:

```ts
absencesInMonth: metrics.absencesInMonth,
excusedAbsencesInMonth: metrics.excusedAbsencesInMonth,
```

Обновить тест-фикстуры at-risk (`excusedAbsencesInMonth: 0` или осмысленное значение).

- [ ] **Step 3: level-stats / top-students**

```ts
// level-stats
totalAbsences: allSessions.filter(
  (s) => s.attendance === 'ABSENT' && !s.absenceExcused,
).length,

// top-students
absences: student.sessions.filter(
  (s) => s.attendance === 'ABSENT' && !s.absenceExcused,
).length,
```

Убедиться, что Prisma-запросы в этих файлах выбирают `absenceExcused` (добавить в `select`/`include` если сейчас только `attendance`).

- [ ] **Step 4: Run unit tests**

```bash
pnpm test:unit src/shared/lib/student-metrics src/shared/lib/analytics-queries
```

Expected: PASS.

---

### Task 5: API sessions + клиентские типы

**Files:**
- Modify: `src/app/api/sessions/route.ts`
- Modify: `src/features/journal/lib/get-student-session.ts`
- Modify: `src/entities/session/api/use-sessions.ts`

**Interfaces:**
- Consumes: `CreateSessionInput.absenceExcused`, `absenceReason`
- Produces: `StudentSession` / `ClientDaySession` с теми же полями

- [ ] **Step 1: Persist в POST**

В `route.ts`:

```ts
const {
  studentId,
  groupId,
  date,
  attendance,
  lateMinutes,
  note,
  absenceExcused,
  absenceReason,
  completions,
} = parsed.data

const sessionData = {
  attendance,
  lateMinutes: attendance === 'LATE' ? lateMinutes : null,
  note,
  absenceExcused: attendance === 'ABSENT' ? absenceExcused : false,
  absenceReason: attendance === 'ABSENT' ? absenceReason : null,
}
```

(Схема уже нормализует — дублирование на API ок для ясности.)

- [ ] **Step 2: get-student-session**

Расширить `DaySessionRecord` и `select` / `serializeDaySession`:

```ts
absenceExcused: boolean
absenceReason: string | null
```

- [ ] **Step 3: use-sessions типы**

```ts
type CreateSessionPayload = {
  // ...
  absenceExcused?: boolean
  absenceReason?: string | null
  completions: ...
}

export type StudentSession = {
  // ...
  absenceExcused: boolean
  absenceReason: string | null
  completions: ...
}
```

- [ ] **Step 4: Smoke typecheck (optional)**

```bash
pnpm exec tsc --noEmit
```

Или достаточно lint затронутых файлов после Task 6.

---

### Task 6: UI журнала — AttendanceButtons + save

**Files:**
- Modify: `src/features/journal/ui/AttendanceButtons.tsx`
- Modify: `src/features/journal/model/use-lesson-page.ts`
- Modify: `src/features/journal/ui/lesson/LessonStepsSection.tsx`
- Modify: `src/features/journal/ui/LessonPage.tsx` (если прокидывает attendance props)

**Interfaces:**
- Consumes: Task 5 payload fields
- Produces: UI при ABSENT: Switch «Уважительная причина» + Input «Причина»

- [ ] **Step 1: Расширить AttendanceButtons**

Props:

```ts
type AttendanceButtonsProps = {
  value: Attendance
  lateMinutes: number
  absenceExcused: boolean
  absenceReason: string
  onChange: (
    attendance: Attendance,
    lateMinutes?: number,
    absence?: { excused: boolean; reason: string },
  ) => void
  // ...existing
}
```

При выборе не-ABSENT вызывать `onChange` без excused (родитель сбросит state).

При ABSENT под lateMinutes-блоком (заменить `Flex` на `div` с Tailwind):

```tsx
{value === 'ABSENT' && (
  <div className="flex flex-col gap-2">
    <Checkbox
      checked={absenceExcused}
      disabled={disabled}
      onChange={(e) =>
        onChange('ABSENT', undefined, {
          excused: e.target.checked,
          reason: absenceReason,
        })
      }
    >
      Уважительная причина
    </Checkbox>
    <Input.TextArea
      value={absenceReason}
      disabled={disabled}
      placeholder="Причина пропуска (необязательно)"
      rows={2}
      onChange={(e) =>
        onChange('ABSENT', undefined, {
          excused: absenceExcused,
          reason: e.target.value,
        })
      }
    />
  </div>
)}
```

Импорты: `Checkbox`, `Input` из antd; убрать `Flex`.

- [ ] **Step 2: use-lesson-page state**

```ts
const [absenceExcused, setAbsenceExcused] = useState(false)
const [absenceReason, setAbsenceReason] = useState('')
```

При загрузке `existingSession`:

```ts
setAbsenceExcused(existingSession.absenceExcused ?? false)
setAbsenceReason(existingSession.absenceReason ?? '')
```

Иначе сброс в `false` / `''`.

Handler:

```ts
const handleAttendanceChange = (
  value: Attendance,
  minutes?: number,
  absence?: { excused: boolean; reason: string },
) => {
  setAttendance(value)
  if (minutes !== undefined) setLateMinutes(minutes)
  if (value !== 'ABSENT') {
    setAbsenceExcused(false)
    setAbsenceReason('')
    return
  }
  if (absence) {
    setAbsenceExcused(absence.excused)
    setAbsenceReason(absence.reason)
  }
}
```

В `ensureSession` и `saveSession` payload:

```ts
absenceExcused: attendance === 'ABSENT' ? absenceExcused : false,
absenceReason:
  attendance === 'ABSENT' ? absenceReason.trim() || null : null,
```

Прокинуть props в return объекта хука / LessonStepsSection.

- [ ] **Step 3: LessonStepsSection + LessonPage**

Добавить props `absenceExcused`, `absenceReason` и передать в `AttendanceButtons`. Обновить `onAttendanceChange` сигнатуру.

- [ ] **Step 4: Manual sanity** — `pnpm lint` на изменённых файлах или открыть урок в UI.

---

### Task 7: Аналитика — бейджи в колонке «Пропуски»

**Files:**
- Modify: `src/features/analytics/ui/AtRiskStudentsTable.tsx`

**Interfaces:**
- Consumes: `AtRiskStudentRow.absencesInMonth`, `.excusedAbsencesInMonth`

- [ ] **Step 1: Рендер колонки**

```tsx
import { Tag } from 'antd'

{
  title: 'Пропуски',
  key: 'absences',
  render: (_: unknown, record: AtRiskStudentRow) => {
    const unexcused = record.absencesInMonth
    const excused = record.excusedAbsencesInMonth
    if (unexcused === 0 && excused === 0) return '0'
    return (
      <div className="flex flex-wrap gap-1">
        {unexcused > 0 && <Tag color="red">{unexcused}</Tag>}
        {excused > 0 && <Tag color="gold">{excused}</Tag>}
      </div>
    )
  },
}
```

(`gold` ≈ жёлтый в antd; при необходимости `orange`.)

- [ ] **Step 2: Проверить типы TypeScript** — таблица компилируется с новым полем.

---

### Task 8: E2E

**Files:**
- Create: `e2e/excused-absence.spec.ts`
- Possibly: `e2e/helpers/codes.ts` (существующие TEST_CODES)

**Interfaces:**
- Consumes: teacher login, journal student lesson, analytics page

- [ ] **Step 1: Написать spec**

Минимальный сценарий (адаптировать селекторы под существующие helpers из `e2e/helpers/` и `e2e/journal.spec.ts` / `e2e/teacher-analytics.spec.ts`):

1. Войти как учитель.
2. Открыть урок ученика, выбрать «Прогул», включить «Уважительная причина», опционально ввести текст, сохранить.
3. Открыть аналитику → в таблице «Требуют внимания» у ученика виден жёлтый бейдж (если ученик в at-risk) **или** проверить через повторное открытие урока, что чекбокс и причина сохранились.

Если ученик с одним уважительным пропуском не попадает в at-risk (порог 3 неуваж.), E2E фокус на **persist в журнале** + unit на аналитику уже покрывают risk. Дополнительно: сохранить 1 неуважительный — красный бейдж появится только когда ученик в таблице; проще assert на reload журнала:

```ts
// псевдокод
await clickRadioButton(page, 'Прогул')
await page.getByRole('checkbox', { name: 'Уважительная причина' }).check()
await page.getByPlaceholder('Причина пропуска').fill('Болезнь')
await page.getByRole('button', { name: /Сохранить урок/ }).click()
// reload lesson
await expect(page.getByRole('checkbox', { name: 'Уважительная причина' })).toBeChecked()
await expect(page.getByPlaceholder('Причина пропуска')).toHaveValue('Болезнь')
```

- [ ] **Step 2: Run e2e**

```bash
pnpm test:e2e e2e/excused-absence.spec.ts
```

Expected: PASS (при поднятом test DB / seed).

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `absenceExcused` / `absenceReason` на Session | 1 |
| Сброс при PRESENT/LATE | 2, 5, 6 |
| Причина необязательна | 2, 6 |
| UI при Прогул | 6 |
| Риск только неуваж. | 3 |
| Колонка бейджи красный/жёлтый | 7 |
| LevelStats/TopStudents только неуваж. | 4 |
| Без часов | — (не делаем) |
| E2E | 8 |

## Self-review notes

- Имена полей единообразны: `absenceExcused`, `absenceReason`, `excusedAbsencesInMonth`.
- Уважительный пропуск **сбрасывает** consecutive streak (явное решение в Task 3) — иначе 2 неуваж. + 1 уваж. + 1 неуваж. давали бы ложный риск.
- Коммиты в шагах не обязательны без запроса пользователя (Global Constraints).
