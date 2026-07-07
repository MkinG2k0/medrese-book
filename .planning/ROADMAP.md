# Roadmap: Электронный дневник медресе

## Overview

**Milestone v2.0 — Система предметов:** переход от одной глобальной программы Корана к мультипредметной модели. Прогресс, журнал и аналитика ведутся по предмету. Программа — шаблон на предмет (уровни → шаги), группа привязана к одному предмету, ученик может учиться в нескольких группах.

**Предыдущий milestone v1.0** (фазы 0–9) завершён частично: аналитика ученика, отпуска, realtime-уведомления.

## Phases (v2.0)

**Phase Numbering:** продолжение с Phase 10 (после v1.0 Phase 9)

- [x] **Phase 10: Subject Foundation** — схема, CRUD предметов, редактор программы предмета (completed 2026-07-07)
- [ ] **Phase 11: Groups & Enrollment** — предмет у группы, зачисление учеников в несколько групп
- [ ] **Phase 12: Progress & Sessions** — прогресс по предмету, сессии с subjectId
- [ ] **Phase 13: Journal** — журнал учителя с выбором группы и уроком по предмету
- [ ] **Phase 14: Analytics** — аналитика с селектом предмета
- [ ] **Phase 15: Student Portal & Extra Assignments** — портал ученика и допзадания по предмету

## Phase Details

### Phase 10: Subject Foundation

**Goal**: Предметы и их программы существуют в системе — менеджер может создать предмет и настроить уровни/шаги
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: SUBJ-01, SUBJ-02, SUBJ-03, SUBJ-04, SUBJ-18
**Success Criteria** (what must be TRUE):

  1. Менеджер создаёт, редактирует и удаляет предметы в админке
  2. У предмета есть своя программа: уровни и шаги (структура как текущая `/admin/program`)
  3. Редактор шагов с Tiptap работает в контексте предмета
  4. Prisma-схема содержит `Subject`, `Level.subjectId`, `Step` в скоупе предмета; seed с демо-предметом (например, «Коран»)
  5. Старая глобальная программа заменена предметной моделью (fresh start)

**Plans**: 5/5 plans complete

Plans:

- [x] 10-01-PLAN.md — Prisma Subject model, prod-safe migration, Zod validations
- [x] 10-02-PLAN.md — subject-admin CRUD UI and /admin/subjects navigation
- [x] 10-03-PLAN.md — Subject-scoped program-actions, deleteLevel, offsets
- [x] 10-04-PLAN.md — Program editor routes and UI; remove /admin/program
- [x] 10-05-PLAN.md — Multi-subject seed (Коран, Таджвид, Арабский язык)

### Phase 11: Groups & Enrollment

**Goal**: Группы привязаны к предметам; ученики зачисляются в несколько групп
**Depends on**: Phase 10
**Requirements**: SUBJ-05, SUBJ-06, SUBJ-07
**Success Criteria** (what must be TRUE):

  1. При создании/редактировании группы менеджер выбирает предмет
  2. Одна группа = один предмет (отображается в списке групп)
  3. Ученик может быть в нескольких группах одновременно (many-to-many)
  4. Админка групп и учеников отражает новую модель зачисления

**Plans**: 6 plans

Plans:

- [ ] 11-01-PLAN.md — Prisma Group.subjectId, GroupEnrollment migration, Zod validations
- [ ] 11-02-PLAN.md — Group CRUD с предметом, список и фильтр, E2E scaffold
- [ ] 11-03-PLAN.md — Зачисление/снятие на странице группы, getGroup enrollments, my-group adapter
- [ ] 11-04-PLAN.md — Journal/API/read-path adapters, regression E2E journal/api-auth
- [ ] 11-05-PLAN.md — seed.ts и seed-e2e.ts на GroupEnrollment
- [ ] 11-06-PLAN.md — user-admin/student-admin adapter, CreateUserForm, UserDetailModal, admin E2E

### Phase 12: Progress & Sessions

**Goal**: Прогресс и сессии работают в скоупе предмета
**Depends on**: Phase 11
**Requirements**: SUBJ-08, SUBJ-09, SUBJ-10
**Success Criteria** (what must be TRUE):

  1. У каждого ученика независимый прогресс (уровень + шаг) на каждый предмет
  2. Сессия уникальна по ученику + дате + предмету; посещаемость привязана к предмету
  3. `recalculate-step-progress` и prior credit работают в скоупе предмета
  4. API и server actions возвращают прогресс с `subjectId`

**Plans**: TBD

### Phase 13: Journal

**Goal**: Учитель ведёт журнал по группе с прогрессом и уроками в контексте предмета
**Depends on**: Phase 12
**Requirements**: SUBJ-11, SUBJ-12, SUBJ-13
**Success Criteria** (what must be TRUE):

  1. Учитель выбирает группу вверху журнала; предмет берётся из группы автоматически
  2. Список учеников показывает прогресс по предмету группы
  3. Страница урока: оценки по шагам программы предмета, посещаемость по предмету
  4. Таймер урока и сохранение сессии работают с `subjectId`

**Plans**: TBD

### Phase 14: Analytics

**Goal**: Аналитика фильтруется по предмету
**Depends on**: Phase 12
**Requirements**: SUBJ-14, SUBJ-15
**Success Criteria** (what must be TRUE):

  1. На странице аналитики есть селект предмета
  2. Топ учеников, статистика по уровням, at-risk считаются для выбранного предмета
  3. История ученика в аналитике показывает занятия по выбранному предмету

**Plans**: TBD

### Phase 15: Student Portal & Extra Assignments

**Goal**: Ученик видит прогресс по всем предметам; допзадания привязаны к шагам предмета
**Depends on**: Phase 12, Phase 13
**Requirements**: SUBJ-16, SUBJ-17
**Success Criteria** (what must be TRUE):

  1. Портал ученика показывает прогресс по каждому предмету, в котором он зачислен
  2. Дополнительные задания фильтруются и назначаются в контексте шагов предмета
  3. История допзаданий в карточке/портале ученика группируется по предмету

**Plans**: TBD

## Progress (v2.0)

**Execution Order:** Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Subject Foundation | 5/5 | Complete    | 2026-07-07 |
| 11. Groups & Enrollment | 0/TBD | Not started | - |
| 12. Progress & Sessions | 0/TBD | Not started | - |
| 13. Journal | 0/TBD | Not started | - |
| 14. Analytics | 0/TBD | Not started | - |
| 15. Student Portal & Extra Assignments | 0/TBD | Not started | - |

---
*Roadmap created: 2026-07-07 — milestone v2.0 Система предметов*
*Continues from v1.0 Phase 9*
