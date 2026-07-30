### Task 3: attendance-risk вЂ” РЅРµСѓРІР°Р¶. vs СѓРІР°Р¶.

**Files:**
- Modify: `src/shared/lib/student-metrics/attendance-risk.ts`
- Modify: `src/shared/lib/student-metrics/attendance-risk.test.ts`
- Modify: `src/shared/lib/student-metrics/index.ts` (РµСЃР»Рё РЅСѓР¶РµРЅ СЂРµСЌРєСЃРїРѕСЂС‚)

**Interfaces:**
- Consumes: `SessionInput` СЃ `absenceExcused?: boolean` (default treat missing as `false`)
- Produces:
  - `countStudentAbsencesInMonth` вЂ” С‚РѕР»СЊРєРѕ РЅРµСѓРІР°Р¶РёС‚РµР»СЊРЅС‹Рµ
  - `countStudentExcusedAbsencesInMonth(sessions, monthRange): number`
  - `evaluateAttendanceRisk` вЂ” streak Рё РјРµСЃСЏС† С‚РѕР»СЊРєРѕ РїРѕ РЅРµСѓРІР°Р¶РёС‚РµР»СЊРЅС‹Рј

- [ ] **Step 1: Write failing tests**

Р”РѕР±Р°РІРёС‚СЊ РІ `attendance-risk.test.ts`:

```ts
import {
  countStudentAbsencesInMonth,
  countStudentExcusedAbsencesInMonth,
  evaluateAttendanceRisk,
} from './attendance-risk'

it('РЅРµ СЃС‡РёС‚Р°РµС‚ СѓРІР°Р¶РёС‚РµР»СЊРЅС‹Рµ РїСЂРѕРїСѓСЃРєРё РІ РїРѕСЂРѕРіРµ СЂРёСЃРєР°', () => {
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

it('РїСЂРµСЂС‹РІР°РµС‚ streak СѓРІР°Р¶РёС‚РµР»СЊРЅС‹Рј РїСЂРѕРїСѓСЃРєРѕРј', () => {
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
  // 2 РЅРµСѓРІР°Р¶. РїРѕРґСЂСЏРґ РїРѕСЃР»Рµ break вЂ” РЅРёР¶Рµ РїРѕСЂРѕРіР° 3
  expect(result).toBe(false)
})

it('СЂР°Р·РґРµР»СЏРµС‚ СЃС‡С‘С‚С‡РёРєРё РЅРµСѓРІР°Р¶. Рё СѓРІР°Р¶.', () => {
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

РћР±РЅРѕРІРёС‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ С„РёРєСЃС‚СѓСЂС‹: Р»РёР±Рѕ РЅРµ РїРµСЂРµРґР°РІР°С‚СЊ `absenceExcused` (default false), Р»РёР±Рѕ СЏРІРЅРѕ `false` вЂ” РїРѕРІРµРґРµРЅРёРµ СЃС‚Р°СЂС‹С… С‚РµСЃС‚РѕРІ РЅРµ РґРѕР»Р¶РЅРѕ СЃР»РѕРјР°С‚СЊСЃСЏ.

- [ ] **Step 2: Run вЂ” expect FAIL**

```bash
pnpm test:unit src/shared/lib/student-metrics/attendance-risk.test.ts
```

- [ ] **Step 3: Implement**

РћР±РЅРѕРІРёС‚СЊ `attendance-risk.ts`:

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

// countAbsencesInMonth в†’ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ isUnexcusedAbsent РІРјРµСЃС‚Рѕ isCountableAbsentSession

// РІ maxConsecutiveAbsences: streak С‚РѕР»СЊРєРѕ РµСЃР»Рё isUnexcusedAbsent; РёРЅР°С‡Рµ currentStreak = 0
// (СѓРІР°Р¶РёС‚РµР»СЊРЅС‹Р№ ABSENT Рё PRESENT/LATE СЃР±СЂР°СЃС‹РІР°СЋС‚ streak)

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

Р РµСЌРєСЃРїРѕСЂС‚ РёР· `src/shared/lib/student-metrics/index.ts` РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё.

- [ ] **Step 4: Run вЂ” expect PASS**

```bash
pnpm test:unit src/shared/lib/student-metrics/attendance-risk.test.ts
```

---
