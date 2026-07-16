---
phase: 260716-mop-journal-mobile
plan: 01
subsystem: ui
tags: [journal, mobile, responsive, ant-design, tailwind]

requires:
  - phase: 260625-m6v-mobile
    provides: AppShell md sidebar offset, shared mobile patterns
provides:
  - Responsive teacher journal list toolbar and columns
  - Mobile-friendly lesson header, metrics, and save bar
affects: [journal, teacher-mobile-ux]

tech-stack:
  added: []
  patterns:
    - "Journal toolbars: flex-col sm:flex-row like JournalHistoryPage"
    - "antd Table column responsive: ['md'] to hide secondary columns <768px"

key-files:
  created: []
  modified:
    - src/features/journal/ui/StudentList.tsx
    - src/features/journal/ui/JournalStudentsTable.tsx
    - src/features/journal/ui/JournalDatePicker.tsx
    - src/features/journal/ui/lesson/LessonPageHeader.tsx
    - src/features/journal/ui/lesson/LessonSaveBar.tsx
    - src/features/analytics/ui/StudentMetricsCards.tsx

key-decisions:
  - "Hide risk/steps/grades columns with responsive md (768), keep name/attendance/step"
  - "Mobile save-and-next label shortens to «Сохранить и далее»; full text from sm"
  - "Optional className on JournalDatePicker for full-width date control on xs"

patterns-established:
  - "Journal list header mirrors JournalHistoryPage responsive toolbar"
  - "LessonSaveBar: flex-col on xs, flex-row from sm; keep md:left-[240px]"

requirements-completed: [QUICK-MOP-01]

coverage:
  - id: D1
    description: "Шапка списка Журнал складывается вертикально на <768px без горизонтального скролла страницы"
    requirement: QUICK-MOP-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit (journal files)"
        status: pass
    human_judgment: true
    rationale: "Нужна визуальная проверка viewport 375px в DevTools"
  - id: D2
    description: "Второстепенные колонки таблицы скрыты ниже md; имя/посещаемость/шаг остаются"
    requirement: QUICK-MOP-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit (journal files)"
        status: pass
    human_judgment: true
    rationale: "antd responsive column hide требует ручной проверки ширины"
  - id: D3
    description: "Страница урока: шапка, compact-метрики и панель сохранения usable на телефоне"
    requirement: QUICK-MOP-01
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit (journal files)"
        status: pass
    human_judgment: true
    rationale: "Touch-target и truncate-текст проверяются визуально"

duration: 3min
completed: 2026-07-16
status: complete
---

# Phase 260716-mop-journal-mobile Plan 01: Journal Mobile Summary

**Список Журнал и страница урока адаптированы под <768px через Tailwind breakpoints и antd `responsive` колонок — без смены архитектуры.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-16T13:22:54Z
- **Completed:** 2026-07-16T13:25:30Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Шапка `/journal`: заголовок сверху, группа и дата на всю ширину на xs (паттерн JournalHistoryPage)
- Таблица: «Риск-сигналы», «Пройдено сегодня», «Оценки» скрыты ниже `md`; клик по строке без изменений
- Урок: вертикальная шапка + история шагов; метрики 1→3 колонки; SaveBar стек кнопок и короткая подпись «Сохранить и далее» на мобилке

## Task Commits

1. **Task 1: Адаптивная шапка и таблица списка Журнал** - `079ae36` (feat)
2. **Task 2: Мобильная страница урока — шапка и сохранение** - `f016e30` (feat)

**Plan metadata:** skipped (orchestrator commits docs; `commit_docs` / quick-task constraint)

## Files Created/Modified

- `src/features/journal/ui/StudentList.tsx` — responsive toolbar
- `src/features/journal/ui/JournalStudentsTable.tsx` — column `responsive: ['md']`
- `src/features/journal/ui/JournalDatePicker.tsx` — optional `className`
- `src/features/journal/ui/lesson/LessonPageHeader.tsx` — stacked header / history link
- `src/features/journal/ui/lesson/LessonSaveBar.tsx` — vertical buttons + short mobile label
- `src/features/analytics/ui/StudentMetricsCards.tsx` — compact grid 1→3

## Decisions Made

- Единый breakpoint `md` (768) для скрытия колонок, согласованно с `useIsMobile` / AppShell
- Сокращение текста next-student через CSS `sm:hidden` / `hidden sm:inline`, без изменения callbacks
- `className` на JournalDatePicker — минимальное расширение API для растягивания даты на xs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Optional className on JournalDatePicker**
- **Found during:** Task 1 (adaptive list header)
- **Issue:** Обёртка `flex-1` не растягивала antd DatePicker без `className` на самом контроле
- **Fix:** Добавлен опциональный `className` prop; StudentList передаёт `min-w-0 flex-1 sm:flex-none sm:w-auto`
- **Files modified:** `JournalDatePicker.tsx`, `StudentList.tsx`
- **Verification:** tsc на изменённых файлах без новых ошибок
- **Committed in:** `079ae36`

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Необходим для mobile stretch даты; scope не расширен за пределы toolbar UX.

## Issues Encountered

- Полный `pnpm exec tsc --noEmit` падает на pre-existing ошибках в `group-actions.test.ts` (`enrollStudents`) — вне скоупа quick task; к изменениям журнала не относится.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Журнал учителя usable на ~375px по layout-контракту плана
- Ручная проверка в DevTools (iPhone SE / 768px+) рекомендуется перед закрытием UAT
- FSD / data flow не менялись

## Self-Check: PASSED

- Files: StudentList, JournalStudentsTable, JournalDatePicker, LessonPageHeader, LessonSaveBar, StudentMetricsCards — FOUND
- Commits: `079ae36`, `f016e30` — FOUND

---
*Phase: 260716-mop-journal-mobile*
*Completed: 2026-07-16*
