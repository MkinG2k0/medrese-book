---
phase: 260718-2pl-pdf-pdf
plan: 01
subsystem: program-admin
tags: [pdf, prisma, step-content, journal, student-portal]

requires:
  - phase: 260718-2kp-remove-teacher-description
    provides: StepForm without plain description; teacherNote intact
provides:
  - Step.pdfUrl nullable column and migration
  - StepForm attach/replace/remove PDF via /api/uploads
  - LessonContentView for PDF + rich-text in journal and student portal
affects: [program-admin, journal, student-portal]

tech-stack:
  added: []
  patterns:
    - "PDF as separate Step.pdfUrl column, not JSON content block"
    - "Reuse POST /api/uploads for PDF like StepEditor images"
    - "Shared LessonContentView for journal + student portal"

key-files:
  created:
    - prisma/migrations/20260718020000_add_step_pdf_url/migration.sql
    - src/features/program-admin/ui/StepPdfViewer.tsx
    - src/features/program-admin/ui/LessonContentView.tsx
  modified:
    - prisma/schema.prisma
    - src/shared/lib/validations/step.ts
    - src/features/program-admin/ui/StepForm.tsx
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
    - src/features/journal/actions/journal-actions.ts
    - src/features/journal/lib/journal-step.ts
    - src/features/journal/ui/StepCard.tsx
    - src/features/student-portal/ui/StudentLessonsList.tsx
    - src/features/student-portal/actions/student-actions.ts

key-decisions:
  - "pdfUrl is a nullable Step column independent of rich-text content blocks"
  - "PDF preview via iframe + «Открыть PDF» link — no new npm packages"
  - "LessonContentView keeps visibility check local to avoid program-admin→journal import"

patterns-established:
  - "Lesson content = optional PDF URL + optional visible StepContent blocks"
  - "StepForm PDF upload mirrors StepEditor FormData → /api/uploads → json.data.url"

requirements-completed: [QUICK-step-pdf-content]

coverage:
  - id: D1
    description: "Админ прикрепляет, заменяет и удаляет PDF на странице редактирования шага"
    requirement: QUICK-step-pdf-content
    verification:
      - kind: other
        ref: "rg pdfUrl|/api/uploads|Прикрепить PDF StepForm + edit page"
        status: pass
    human_judgment: true
    rationale: "Нужна визуальная проверка Upload/save в UI"
  - id: D2
    description: "Журнал и портал ученика показывают PDF и/или rich-text в «Содержание»"
    requirement: QUICK-step-pdf-content
    verification:
      - kind: unit
        ref: "pnpm exec vitest run journal-actions.test.ts program-actions.test.ts"
        status: pass
    human_judgment: true
    rationale: "Три кейса PDF/text/both требуют ручной проверки в UI"

duration: 8min
completed: 2026-07-18
status: complete
---

# Phase 260718-2pl: PDF в содержании шага Summary

**Шаги программы поддерживают прикреплённый PDF (`Step.pdfUrl`): загрузка в админ-форме и отображение в «Содержание» журнала и портала ученика вместе с rich-text или вместо него.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-18T01:58:00Z
- **Completed:** 2026-07-18T02:03:00Z
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments

- Nullable `Step.pdfUrl` + Prisma migration applied
- StepForm: «Прикрепить PDF» / «Заменить» / «Удалить» через `/api/uploads`
- Единый `LessonContentView` в журнале и у ученика; `teacherNote` не затронут

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma pdfUrl + Zod + program-actions** - `b87bdbf` (feat)
2. **Task 2: StepForm — прикрепить / заменить / удалить PDF** - `1919fda` (feat)
3. **Task 3: Отображение PDF в «Содержание»** - `bde6d3b` (feat)

**Plan metadata:** skipped (orchestrator docs commit)

## Files Created/Modified

- `prisma/schema.prisma` — поле `pdfUrl String?`
- `prisma/migrations/20260718020000_add_step_pdf_url/migration.sql` — ADD COLUMN
- `src/shared/lib/validations/step.ts` — optional nullable `pdfUrl` в createStepSchema
- `src/features/program-admin/ui/StepForm.tsx` — Upload PDF в секции «Содержание»
- `src/app/(dashboard)/admin/subjects/.../edit/page.tsx` — `initial.pdfUrl`
- `src/features/program-admin/ui/StepPdfViewer.tsx` — iframe + ссылка «Открыть PDF»
- `src/features/program-admin/ui/LessonContentView.tsx` — PDF + text / empty
- `src/features/journal/actions/journal-actions.ts` — select/return `pdfUrl`
- `src/features/journal/lib/journal-step.ts` — `hasLessonContent`
- `src/features/journal/ui/StepCard.tsx` — lazy-load pdfUrl + LessonContentView
- `src/features/student-portal/actions/student-actions.ts` — lessons.pdfUrl
- `src/features/student-portal/ui/StudentLessonsList.tsx` — LessonContentView

## Decisions Made

- PDF хранится отдельной колонкой, не блоком в JSON `content` — независимы кейсы PDF-only / text-only / both
- Просмотр без новых npm-пакетов (`iframe`)
- `createStep`/`updateStep` уже прокидывают parsed data — отдельный маппинг не понадобился

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] BOM в migration.sql**
- **Found during:** Task 1
- **Issue:** PowerShell `Set-Content` записал UTF-8 BOM → Postgres `syntax error at or near "﻿"`
- **Fix:** Перезапись файла без BOM + `migrate resolve --rolled-back` + повторный `migrate deploy`
- **Files modified:** `prisma/migrations/20260718020000_add_step_pdf_url/migration.sql`
- **Verification:** Migration applied successfully
- **Committed in:** `b87bdbf`

**2. [Rule 2 - Correctness] Локальная проверка видимости блоков в LessonContentView**
- **Found during:** Task 3
- **Issue:** Импорт `hasVisibleStepContent` из journal в program-admin создал бы обратную feature-зависимость
- **Fix:** Локальный `hasVisibleBlocks` в `LessonContentView`; `hasLessonContent` добавлен в journal-step для журнала
- **Files modified:** `LessonContentView.tsx`, `journal-step.ts`
- **Verification:** vitest green
- **Committed in:** `bde6d3b`

## Threat Flags

None — upload/auth boundaries reuse existing `/api/uploads` and step mutation roles (T-2pl-01 mitigated as planned).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: prisma/schema.prisma (pdfUrl)
- FOUND: prisma/migrations/20260718020000_add_step_pdf_url/migration.sql
- FOUND: src/features/program-admin/ui/StepForm.tsx
- FOUND: src/features/program-admin/ui/LessonContentView.tsx
- FOUND: src/features/program-admin/ui/StepPdfViewer.tsx
- FOUND: commits b87bdbf, 1919fda, bde6d3b
