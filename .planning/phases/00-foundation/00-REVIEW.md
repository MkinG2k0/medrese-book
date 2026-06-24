---
phase: 00-foundation
reviewed: 2026-06-24T21:00:00Z
depth: standard
files_reviewed: 43
files_reviewed_list:
  - vitest.config.ts
  - src/shared/lib/analytics-queries/filters.test.ts
  - e2e/helpers/api.ts
  - e2e/helpers/db.ts
  - e2e/api-auth.spec.ts
  - e2e/student-progress.spec.ts
  - e2e/domain-events.spec.ts
  - package.json
  - prisma/migrations/20260624120000_foundation_analytics_flags/migration.sql
  - src/shared/lib/analytics-queries/filters.ts
  - src/shared/lib/analytics-queries/index.ts
  - src/shared/lib/analytics-queries/top-students.ts
  - src/shared/lib/analytics-queries/level-stats.ts
  - prisma/schema.prisma
  - src/shared/lib/analytics.ts
  - src/shared/lib/sync-completions-for-progress.ts
  - src/shared/lib/authorize-api-request.ts
  - src/shared/lib/auth.config.ts
  - src/app/api/students/route.ts
  - src/app/api/sessions/route.ts
  - src/app/api/step-completions/route.ts
  - src/app/api/step-completions/[id]/route.ts
  - src/app/api/uploads/route.ts
  - src/shared/lib/student-progress/index.ts
  - src/shared/lib/student-progress/recalculate.ts
  - src/shared/lib/student-progress/sync-for-progress.ts
  - src/shared/lib/student-progress/offsets.ts
  - src/shared/lib/student-progress/filters.ts
  - src/shared/lib/student-progress/types.ts
  - src/shared/lib/recalculate-step-progress.ts
  - src/shared/lib/step-offset.ts
  - src/features/student-admin/actions/student-admin-actions.ts
  - src/features/journal/actions/journal-actions.ts
  - src/features/user-admin/actions/user-actions.ts
  - src/features/student-portal/actions/student-actions.ts
  - e2e/helpers/antd.ts
  - prisma/migrations/20260624140000_foundation_audit_event/migration.sql
  - src/shared/lib/domain-events/dispatch.ts
  - src/shared/lib/domain-events/types.ts
  - src/shared/lib/domain-events/index.ts
  - src/shared/lib/domain-events/handlers/audit.ts
  - src/shared/lib/domain-events/handlers/notifications.ts
  - src/shared/lib/audit/write-audit-event.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 0: Code Review Report

**Reviewed:** 2026-06-24T21:00:00Z
**Depth:** standard
**Files Reviewed:** 43
**Status:** issues_found

## Summary

Проведён стандартный обзор исходников фазы 00-foundation (планы 01–05): тестовая инфраструктура, флаги аналитики, API-авторизация, модуль `student-progress`, domain events. Архитектура в целом согласована: единый gate `authorizeApiRequest`, централизованные фильтры аналитики, атомарные транзакции с `dispatchDomainEvent`.

Критических уязвимостей безопасности не обнаружено. Основной риск — логическая коллизия adjustment-сессий и уроков в один календарный день: после введения `isAdjustment` код по-прежнему выбирает «любую» сессию за день, что может перезаписать корректировку прогресса или показать её в журнале вместо урока.

## Warnings

### WR-01: Коллизия adjustment-сессии и урока в один день

**File:** `src/app/api/sessions/route.ts:36-45`, `src/features/journal/lib/get-student-session.ts:23-45`
**Issue:** `POST /api/sessions` и `findStudentSessionForDay` ищут сессию за день без фильтра `isAdjustment: false`. Если менеджер в тот же день скорректировал прогресс (`syncCompletionsForProgress` создаёт adjustment-сессию), учитель при сохранении урока обновит adjustment-сессию вместо создания обычной. Поле `isAdjustment` при update не сбрасывается — посещаемость урока исключается из session-метрик аналитики; `deleteMany` completions уничтожает prior-credit записи.
**Fix:**
```typescript
// get-student-session.ts — добавить isAdjustment в select и предпочитать урок
const daySessions = await prisma.session.findMany({
  where: {
    studentId,
    date: { gte: dayRange.start, lte: dayRange.end },
    isAdjustment: false, // только уроки
  },
  // ...
});

// sessions/route.ts POST — аналогично при поиске existingSession
const existingSession = existingSessions.find(
  (s) => isSameCalendarDay(s.date, calendarDay) && !s.isAdjustment,
);
```

### WR-02: `updateUser` для ученика не вызывает `recalculateStudentStepIdx`

**File:** `src/features/user-admin/actions/user-actions.ts:187-231`
**Issue:** `updateStudentProgress` в транзакции выполняет `sync → update → recalculateStudentStepIdx`, а `updateUser` для роли STUDENT — только `sync → update` без пересчёта. При сценарии «все шаги уровня пройдены» ученик не будет автоматически переведён на следующий уровень через `recalculate`, в отличие от admin edit через `student-admin-actions`.
**Fix:**
```typescript
await tx.user.update({ /* ... */ });

await recalculateStudentStepIdx(user.student!.id, tx);

await dispatchDomainEvent({ /* ... */ }, tx);
```

### WR-03: Кэш offset уровней никогда не инвалидируется

**File:** `src/shared/lib/student-progress/offsets.ts:3-17`
**Issue:** `getStepOffsetForLevel` кэширует offsets в module-level переменной. `invalidateStepOffsetCache` экспортируется, но ни один call site (в т.ч. program-admin мутации шагов/уровней) его не вызывает. После изменения программы в рантайме `currentStepIdx` и local/global конверсия будут рассчитываться по устаревшим offsets до рестарта процесса.
**Fix:** Вызвать `invalidateStepOffsetCache()` из server actions program-admin после create/update/delete шагов или уровней (или убрать кэш, если программа меняется редко).

## Info

### IN-01: Мёртвый код `recordAuditEvent`

**File:** `src/shared/lib/domain-events/handlers/audit.ts:6-11`
**Issue:** `recordAuditEvent` дублирует `writeAuditEvent`, но нигде не импортируется — `dispatch.ts` вызывает `writeAuditEvent` напрямую.
**Fix:** Удалить `handlers/audit.ts` или подключить через `dispatch.ts` для единой точки входа.

### IN-02: Несогласованный формат ошибки в uploads

**File:** `src/app/api/uploads/route.ts:16-18`
**Issue:** При отсутствии файла возвращается `Response.json({ error: '...' })` без поля `data`, тогда как остальные API routes используют хелпер `error()` с формой `{ data: null, error: string }`.
**Fix:**
```typescript
import { error, created } from '@/shared/api'
// ...
if (!file || !(file instanceof File)) {
  return error('Файл не найден')
}
```

---

_Reviewed: 2026-06-24T21:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
