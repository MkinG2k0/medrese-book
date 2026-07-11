# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Система предметов

**Shipped:** 2026-07-11
**Phases:** 6 | **Plans:** 27 | **Tasks:** 81

### What Was Built

- Мультипредметная Prisma-схема: Subject, Group.subjectId, GroupEnrollment, Session.groupId
- CRUD предметов и subject-scoped редактор программы (Tiptap)
- Группы с одним предметом; ученик в нескольких группах с независимым прогрессом
- Прогресс и сессии per enrollment (D-01); recalculate/syncCompletions per groupId
- Журнал учителя с выбором группы и уроком в контексте предмета
- Аналитика с селектом предмета; метрики в subject scope
- Портал ученика: дашборд per enrollment, groupId-навигация, история допзаданий по предметам

### What Worked

- Поэтапная миграция 10→15 с prod-safe backfill на каждом шаге
- Wave-планирование внутри фаз (особенно 11, 12, 13) снижало риск регрессий
- Раннее решение D-01 (прогресс на GroupEnrollment, не Subject) упростило журнал и сессии
- Vitest на recalculate/syncCompletions поймал регрессии до E2E

### What Was Inefficient

- STATE.md drift: статус «executing» при 100% completion — нужен sync после каждой фазы
- Quick tasks без SUMMARY.md засоряют audit-open при milestone close
- Глобальный currentStepIdx legacy остался в части read-paths — техдолг для следующего milestone

### Patterns Established

- Subject scope через `Step.level.subjectId` без лишних FK на допзадания
- groupId в URL журнала и портала ученика как единый контракт навигации
- Primary enrollment fallback (enrolledAt asc) для deep links без groupId

### Key Lessons

1. Backfill-миграции отдельным планом (wave 1) — обязательны перед UI/API waves
2. Enrollment-scoped progress точнее subject-scoped для учеников в двух группах одного предмета
3. E2E seed с dual enrollment критичен для journal/student-portal regression

### Cost Observations

- Timeline: 2026-07-07 → 2026-07-11 (5 дней активной разработки v2.0)
- Git range: 146 commits, 319 files, +21k / −12k LOC (10-01 → 15-04)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v2.0 | 6 | 27 | Мультипредметная модель; wave-планирование внутри фаз |

### Cumulative Quality

| Milestone | Verification | UAT Debt |
|-----------|--------------|----------|
| v2.0 | All 6 phases passed | 0 outstanding |

### Top Lessons (Verified Across Milestones)

1. Prod-safe migrations с backfill до UI — снижает риск деплоя
2. FSD + server actions/API dual pattern сохраняется при brownfield-расширении
