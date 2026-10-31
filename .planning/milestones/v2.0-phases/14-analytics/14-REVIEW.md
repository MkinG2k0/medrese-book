---
phase: 14-analytics
reviewed: 2026-07-11T22:35:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - src/features/analytics/lib/analytics-storage.ts
  - src/features/analytics/ui/AnalyticsSubjectPicker.tsx
  - src/features/analytics/lib/analytics-query.ts
  - src/features/analytics/lib/analytics-query.test.ts
  - src/features/analytics/actions/analytics-actions.ts
  - src/app/(dashboard)/analytics/page.tsx
  - src/features/analytics/ui/AnalyticsTeacherPicker.tsx
  - src/features/analytics/ui/AnalyticsGroupPicker.tsx
  - src/features/analytics/ui/AnalyticsMonthPicker.tsx
  - src/shared/lib/analytics-queries/top-students.ts
  - src/shared/lib/analytics-queries/top-students.test.ts
  - src/shared/lib/analytics-queries/level-stats.ts
  - src/shared/lib/analytics-queries/level-stats.test.ts
  - src/shared/lib/analytics-queries/at-risk-students.ts
  - src/shared/lib/analytics-queries/at-risk-students.test.ts
  - src/shared/lib/student-metrics/load-student-metrics.ts
  - src/shared/lib/student-metrics/load-student-metrics.test.ts
  - src/app/api/at-risk-students/route.ts
  - src/app/api/at-risk-students/route.test.ts
  - src/entities/student-metrics/model/types.ts
  - src/entities/student-metrics/api/use-student-metrics.ts
  - src/features/analytics/ui/TopStudents.tsx
  - src/app/api/step-completions/route.ts
  - src/app/api/step-completions/route.test.ts
  - src/entities/step-completion/api/use-step-completions.ts
  - src/features/analytics/ui/StudentStudyHistoryModal.tsx
  - src/features/analytics/ui/AtRiskStudentsTable.tsx
  - e2e/analytics-student-history.spec.ts
  - e2e/student-analytics.spec.ts
  - e2e/helpers/load-test-env.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-07-11T22:35:00Z  
**Depth:** standard  
**Files Reviewed:** 30  
**Status:** issues_found

## Summary

Проведён стандартный обзор реализации subject-scoped фильтрации аналитики (планы 14-01–14-03): URL/query helpers, server actions, Prisma-запросы метрик, API step-completions/at-risk, UI pickers и модалка истории учёбы.

Subject-scoping для метрик и step-completions реализован последовательно через `Group.subjectId` и валидацию `subjectId` на API at-risk. Обнаружена **критическая** дыра в авторизации: роль TEACHER может запросить данные всех учителей или конкретного чужого учителя через параметр `teacher` — частичный фикс в 14-02 закрыл только дефолт `ALL_TEACHERS`, но не произвольные значения. Также не подключён `readAnalyticsSubjectId` (localStorage fallback) и вкладка «Доп. задания» в модалке не фильтруется по предмету.

## Critical Issues

### CR-01: TEACHER может получить аналитику всех/чужих учителей через `teacher` param

**File:** `src/features/analytics/lib/analytics-query.ts:48-71`, `src/app/(dashboard)/analytics/page.tsx:72-77`, `src/app/api/at-risk-students/route.ts:44-49`  
**Issue:** `resolveAnalyticsTeacherFilter` для роли TEACHER не ограничивает `teacherParam`. Значения `teacher=all` (`ALL_TEACHERS`) или произвольный `teacher=<чужой id>` из `validTeacherIds` возвращают `filterTeacherId: null` или чужой ID **до** fallback на `sessionTeacherId`. Страница `/analytics` и API `/api/at-risk-students` используют этот helper напрямую — учитель видит топ, уровни и at-risk по всем преподавателям или выбранному чужому учителю. Фикс 14-02 убрал только неявный дефолт `ALL_TEACHERS`, но явный `?teacher=all` и подмена ID остаются.

**Fix:**
```typescript
export function resolveAnalyticsTeacherFilter(
  role: string,
  sessionTeacherId: string | null,
  teacherParam?: string,
  validTeacherIds?: Set<string>,
): { filterTeacherId: string | null; selectedTeacher: string } {
  // TEACHER всегда ограничен своим teacherId
  if (role === 'TEACHER' && sessionTeacherId) {
    return {
      filterTeacherId: sessionTeacherId,
      selectedTeacher: sessionTeacherId,
    }
  }

  if (teacherParam === ALL_TEACHERS) {
    return { filterTeacherId: null, selectedTeacher: ALL_TEACHERS }
  }
  // ... остальная логика для MANAGER / SUPER_ADMIN
}
```

Дополнительно: скрыть опцию «Все учителя» в `AnalyticsTeacherPicker` для роли TEACHER (client-side UX) и добавить unit-тесты на запрет `teacher=all` для TEACHER в `route.test.ts`.

## Warnings

### WR-01: `readAnalyticsSubjectId` не используется — localStorage fallback не работает

**File:** `src/features/analytics/lib/analytics-storage.ts:3-10`, `src/features/analytics/ui/AnalyticsSubjectPicker.tsx:41`  
**Issue:** По плану 14-01 и SUMMARY заявлен паттерн journal-storage с read/write fallback. `writeAnalyticsSubjectId` вызывается при смене предмета, но `readAnalyticsSubjectId` нигде не импортируется. При переходе на `/analytics` без `?subjectId=` сервер всегда подставляет `DEFAULT_QURAN_SUBJECT_ID`, игнорируя последний выбор пользователя из localStorage.

**Fix:** Добавить client-компонент-обёртку (аналог journal) или `useEffect` в `AnalyticsSubjectPicker`, который при отсутствии `subjectId` в URL делает `router.replace` с `readAnalyticsSubjectId()` если значение валидно для списка предметов.

### WR-02: Вкладка «Доп. задания» в модалке не subject-scoped

**File:** `src/features/analytics/ui/StudentStudyHistoryModal.tsx:50-51`  
**Issue:** Вкладка «Шаги программы» фильтруется через `useStepCompletions(..., subjectId)`, но `useStudentExtraAssignmentHistory(studentId)` не принимает `subjectId` и загружает все доп. задания ученика. При enrollments в нескольких предметах модалка показывает смешанные данные — противоречит цели subject-scoped истории (SUBJ-15).

**Fix:** Расширить API `/api/extra-assignments/history` и хук `useStudentExtraAssignmentHistory` параметром `subjectId` с фильтром по `session.group.subjectId`; передать `subjectId` из модалки.

## Info

### IN-01: Дублирование `buildGroupScopeFilter` в трёх query-модулях

**File:** `src/shared/lib/analytics-queries/top-students.ts:27-37`, `level-stats.ts:21-31`, `at-risk-students.ts:12-22`  
**Issue:** Идентичная функция скопирована три раза. Риск расхождения фильтров при будущих правках scope.

**Fix:** Вынести в `src/shared/lib/analytics-queries/filters.ts` или `scope.ts` и импортировать из одного места.

---

_Reviewed: 2026-07-11T22:35:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
