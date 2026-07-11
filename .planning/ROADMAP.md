# Roadmap: Электронный дневник медресе

## Overview

**Milestone v2.0 — Система предметов:** переход от одной глобальной программы Корана к мультипредметной модели. Прогресс, журнал и аналитика ведутся по предмету. Программа — шаблон на предмет (уровни → шаги), группа привязана к одному предмету, ученик может учиться в нескольких группах.

**Предыдущий milestone v1.0** (фазы 0–9) завершён частично: аналитика ученика, отпуска, realtime-уведомления.

## Phases (v2.0)

**Phase Numbering:** продолжение с Phase 10 (после v1.0 Phase 9)

- [x] **Phase 10: Subject Foundation** — схема, CRUD предметов, редактор программы предмета (completed 2026-07-07)
- [x] **Phase 11: Groups & Enrollment** — предмет у группы, зачисление учеников в несколько групп (completed 2026-07-11)
- [x] **Phase 12: Progress & Sessions** — прогресс на зачисление (группу), сессии с groupId (completed 2026-07-11)
- [x] **Phase 13: Journal** — журнал учителя с выбором группы и уроком по предмету (awaiting human verification) (completed 2026-07-11)
- [x] **Phase 14: Analytics** — аналитика с селектом предмета (completed 2026-07-11)
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

**Plans**: 6/6 plans complete

Plans:

- [x] 11-01-PLAN.md — Prisma Group.subjectId, GroupEnrollment migration, Zod validations (wave 1)
- [x] 11-05-PLAN.md — seed.ts и seed-e2e.ts на GroupEnrollment (wave 2, до E2E)
- [x] 11-02-PLAN.md — Group CRUD, getGroup/getMyGroup enrollments, страницы [groupId]/my-group, E2E scaffold (wave 3)
- [x] 11-03-PLAN.md — EnrollStudentModal, enrollment actions, E2E multi-enrollment (wave 4)
- [x] 11-04-PLAN.md — Journal/API adapters, recalculate.ts, compile gate, regression E2E (wave 5)
- [x] 11-06-PLAN.md — user-admin/student-admin adapter, CreateUserForm, UserDetailModal, admin E2E (wave 5)

### Phase 12: Progress & Sessions

**Goal**: Прогресс и сессии работают в скоупе группы (зачисления)
**Depends on**: Phase 11
**Requirements**: SUBJ-08, SUBJ-09, SUBJ-10
**Success Criteria** (what must be TRUE):

  1. У каждого зачисления (GroupEnrollment) независимый прогресс (уровень + шаг); ученик в двух группах — два прогресса
  2. Сессия уникальна по ученику + дате + groupId; посещаемость и оценки в рамках занятия группы
  3. `recalculate-step-progress` и prior credit работают per enrollment (auto-promote только текущего зачисления)
  4. API и server actions возвращают прогресс с контекстом groupId / enrollment

**Note**: Intentional deviation от «прогресс по предмету» — решение D-01 (discuss 2026-07-11). UI журнала — Phase 13.

**Plans**: 5/5 plans complete

Plans:
**Wave 1**

- [x] 12-01-PLAN.md — Schema GroupEnrollment.currentStepIdx, Session.groupId, prod-safe migration (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 12-02-PLAN.md — recalculate и syncCompletionsForProgress per enrollment (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 12-03-PLAN.md — Sessions API, step-completions, journal-actions (wave 3)
- [x] 12-04-PLAN.md — students API, student-admin, group enroll, compile sweep (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 12-05-PLAN.md — Docs SUBJ-08…10, seed, финальная верификация (wave 4)

### Phase 13: Journal

**Goal**: Учитель ведёт журнал по группе с прогрессом и уроками в контексте предмета
**Depends on**: Phase 12
**Requirements**: SUBJ-11, SUBJ-12, SUBJ-13
**Success Criteria** (what must be TRUE):

  1. Учитель выбирает группу вверху журнала; предмет берётся из группы автоматически
  2. Список учеников показывает прогресс по предмету группы
  3. Страница урока: оценки по шагам программы предмета, посещаемость по предмету
  4. Таймер урока и сохранение сессии работают с `subjectId`

**Plans**: 4/4 plans complete

Plans:

**Wave 1**

- [x] 13-01-PLAN.md — journal-url, storage, getTeacherGroups, useJournalDate groupId (wave 1)

**Wave 2** *(blocked on Wave 1)*

- [x] 13-02-PLAN.md — Group Select на /journal, список учеников per enrollment (wave 2)

**Wave 3** *(blocked on Wave 2)*

- [x] 13-03-PLAN.md — Страница урока с groupId, LessonPageHeader контекст (wave 3)

**Wave 4** *(blocked on Wave 3)*

- [x] 13-04-PLAN.md — History routes, E2E, удаление getTeacherGroup (wave 4)

### Phase 14: Analytics

**Goal**: Аналитика фильтруется по предмету
**Depends on**: Phase 12
**Requirements**: SUBJ-14, SUBJ-15
**Success Criteria** (what must be TRUE):

  1. На странице аналитики есть селект предмета
  2. Топ учеников, статистика по уровням, at-risk считаются для выбранного предмета
  3. История ученика в аналитике показывает занятия по выбранному предмету

**Plans**: 3/3 plans complete

Plans:

**Wave 1**

- [x] 14-01-PLAN.md — Селект предмета, subjectId в URL, role-scoped subjects, совместимость групп (wave 1)

**Wave 2** *(blocked on Wave 1)*

- [x] 14-02-PLAN.md — getTopStudents/getLevelStats/getAtRiskStudents в subject scope (wave 2)

**Wave 3** *(blocked on Wave 2)*

- [x] 14-03-PLAN.md — История учёбы по предмету, API/hook, E2E (wave 3)

### Phase 15: Student Portal & Extra Assignments

**Goal**: Ученик видит прогресс по всем предметам; допзадания привязаны к шагам предмета
**Depends on**: Phase 12, Phase 13
**Requirements**: SUBJ-16, SUBJ-17
**Success Criteria** (what must be TRUE):

  1. Портал ученика показывает прогресс по каждому предмету, в котором он зачислен
  2. Дополнительные задания фильтруются и назначаются в контексте шагов предмета
  3. История допзаданий в карточке/портале ученика группируется по предмету

**Plans**: 1/4 plans executed

Plans:

**Wave 1** *(15-01 and 15-03 parallel)*

- [x] 15-01-PLAN.md — Дашборд /student/me: карточки per enrollment, метрики, query helpers (wave 1)
- [ ] 15-03-PLAN.md — Subject scope справочника и assign modal (wave 1)

**Wave 2** *(blocked on Wave 1 completion of 15-01)*

- [ ] 15-02-PLAN.md — groupId URL, deep links, scoped lessons/history (wave 2)

**Wave 3** *(blocked on Wave 2 + 15-03)*

- [ ] 15-04-PLAN.md — История допзаданий ученика по предметам + E2E (wave 3)

## Progress (v2.0)

**Execution Order:** Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Subject Foundation | 5/5 | Complete    | 2026-07-07 |
| 11. Groups & Enrollment | 6/6 | Complete    | 2026-07-11 |
| 12. Progress & Sessions | 5/5 | Complete    | 2026-07-11 |
| 13. Journal | 4/4 | Complete    | 2026-07-11 |
| 14. Analytics | 3/3 | Complete    | 2026-07-11 |
| 15. Student Portal & Extra Assignments | 1/4 | In Progress|  |

---
*Roadmap created: 2026-07-07 — milestone v2.0 Система предметов*
*Continues from v1.0 Phase 9*
