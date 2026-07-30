### Task 4: РњРµС‚СЂРёРєРё at-risk + LevelStats/TopStudents

**Files:**
- Modify: `src/shared/lib/student-metrics/types.ts`
- Modify: `src/shared/lib/student-metrics/load-student-metrics.ts`
- Modify: `src/shared/lib/analytics-queries/at-risk-students.ts`
- Modify: `src/shared/lib/analytics-queries/at-risk-students.test.ts` (РґРѕР±Р°РІРёС‚СЊ `excusedAbsencesInMonth` РІ С„РёРєСЃС‚СѓСЂС‹)
- Modify: `src/shared/lib/analytics-queries/level-stats.ts`
- Modify: `src/shared/lib/analytics-queries/top-students.ts`
- Modify: `src/shared/lib/analytics-queries/top-students.test.ts` / level-stats tests РµСЃР»Рё РµСЃС‚СЊ

**Interfaces:**
- Produces: `AtRiskStudentRow.excusedAbsencesInMonth: number`
- Produces: `StudentMetricsBundle.excusedAbsencesInMonth: number`

- [ ] **Step 1: РћР±РЅРѕРІРёС‚СЊ С‚РёРїС‹**

Р’ `AtRiskStudentRow`:

```ts
absencesInMonth: number
excusedAbsencesInMonth: number
```

Р’ `StudentMetricsBundle` (load-student-metrics):

```ts
absencesInMonth: number
excusedAbsencesInMonth: number
```

- [ ] **Step 2: load-student-metrics вЂ” select + count**

Р’ `sessions.select` РґРѕР±Р°РІРёС‚СЊ `absenceExcused: true`.

Р’ `computeMetricsForEnrollment`:

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

Р’ `at-risk-students.ts` РїСЂРѕР±СЂРѕСЃРёС‚СЊ:

```ts
absencesInMonth: metrics.absencesInMonth,
excusedAbsencesInMonth: metrics.excusedAbsencesInMonth,
```

РћР±РЅРѕРІРёС‚СЊ С‚РµСЃС‚-С„РёРєСЃС‚СѓСЂС‹ at-risk (`excusedAbsencesInMonth: 0` РёР»Рё РѕСЃРјС‹СЃР»РµРЅРЅРѕРµ Р·РЅР°С‡РµРЅРёРµ).

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

РЈР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ Prisma-Р·Р°РїСЂРѕСЃС‹ РІ СЌС‚РёС… С„Р°Р№Р»Р°С… РІС‹Р±РёСЂР°СЋС‚ `absenceExcused` (РґРѕР±Р°РІРёС‚СЊ РІ `select`/`include` РµСЃР»Рё СЃРµР№С‡Р°СЃ С‚РѕР»СЊРєРѕ `attendance`).

- [ ] **Step 4: Run unit tests**

```bash
pnpm test:unit src/shared/lib/student-metrics src/shared/lib/analytics-queries
```

Expected: PASS.

---
