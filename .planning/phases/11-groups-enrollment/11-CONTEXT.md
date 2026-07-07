# Phase 11: Groups & Enrollment - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 11 доставляет **привязку групп к предметам и мульти-зачисление учеников**:

- `Group.subjectId` — одна группа = один предмет (SUBJ-05, SUBJ-07)
- Many-to-many ученик ↔ группы через junction-таблицу (SUBJ-06)
- UI: выбор предмета при создании группы; зачисление/снятие учеников на странице группы
- Уровень программы назначается **при зачислении** в группу (уровни предмета этой группы)

**Вне скоупа фазы 11:** прогресс по предмету (`StudentSubjectProgress`), сессии и completions в скоупе предмета (Phase 12), журнал (Phase 13), аналитика (Phase 14), портал ученика (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Модель зачисления (Student ↔ Group)
- **D-01:** Удалить `Student.groupId` — единственный источник зачислений: junction-таблица (например `StudentGroup` / `GroupEnrollment`).
- **D-02:** UI зачисления **только на странице группы** `/groups/[groupId]` — добавление и удаление учеников из состава группы.
- **D-03:** Добавление существующего ученика — модалка с поиском/выбором из **всех учеников системы** (уже в другой группе — допустимо).
- **D-04:** При зачислении в группу **обязательно выбирать уровень** программы предмета этой группы.
- **D-05:** Уровень хранится **на записи зачисления** (junction), не глобально на `Student` — у каждой пары ученик+группа свой `levelId`.

### Предмет у группы
- **D-06:** `subjectId` **обязателен** при создании группы — без предмета группу создать нельзя.
- **D-07:** Предмет **не меняется** после создания — поле read-only при редактировании группы (только имя и учитель).
- **D-08:** Список групп `/groups` — колонка **«Предмет»** + **фильтр по предмету**.
- **D-09:** Форма группы: предмет + название + учитель. Уровни программы на форме группы **не выбираются** — только при зачислении ученика.

### Несколько групп одного предмета
- **D-10:** Ученик **может** быть зачислен в две и более группы **одного и того же предмета** (не запрещать).
- **D-11:** При дублировании предмета уровень **независим на каждое зачисление** (две группы Корана → два `levelId` в junction).

### Claude's Discretion
- Имя и точная схема junction (`StudentGroup` vs `GroupEnrollment`), поля `enrolledAt`, индексы, `@@unique` при необходимости.
- **Миграция данных** (область не обсуждалась с пользователем): привязать существующие группы к предмету «Коран» (`DEFAULT_QURAN_SUBJECT_ID`); перенести `Student.groupId` + `Student.levelId` в junction; безопасная prod-migration по правилам prisma-migrations.
- Адаптация `user-admin` / `createUsers` при удалении `Student.groupId` (минимальные изменения для сохранения создания ученика).
- Валидация: уровень при зачислении должен принадлежать `group.subjectId`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements
- `.planning/PROJECT.md` — milestone v2.0, решение «1 группа = 1 предмет», мульти-группы
- `.planning/REQUIREMENTS.md` — SUBJ-05, SUBJ-06, SUBJ-07
- `.planning/ROADMAP.md` — Phase 11 goal and success criteria
- `.planning/phases/10-subject-foundation/10-CONTEXT.md` — D-03 программа как шаблон на предмет; границы фазы 10

### Schema & constants
- `prisma/schema.prisma` — текущие `Group`, `Student` (без `subjectId`, с `groupId`)
- `prisma/lib/subject-constants.ts` — `DEFAULT_QURAN_SUBJECT_ID` для backfill миграции
- `.cursor/rules/prisma-migrations.mdc` — prod-safe миграции

### Groups feature (рефакторинг)
- `src/features/groups/actions/group-actions.ts` — CRUD групп
- `src/features/groups/ui/GroupsList.tsx` — список + модалки create/edit
- `src/features/groups/ui/CreateGroupForm.tsx` / `EditGroupForm.tsx`
- `src/app/(dashboard)/groups/page.tsx` — страница списка
- `src/app/(dashboard)/groups/[groupId]/page.tsx` — состав группы
- `src/features/groups/ui/GroupStudentsTable.tsx` — таблица учеников группы

### Student admin & validations
- `src/features/student-admin/actions/student-admin-actions.ts`
- `src/shared/lib/validations/user.ts` — `groupId` / `levelId` при создании STUDENT
- `src/features/user-admin/` — создание пользователей-учеников

### Subject admin (выбор предмета в форме группы)
- `src/features/subject-admin/actions/subject-actions.ts` — `getSubjects`
- `src/features/program-admin/actions/program-actions.ts` — `getLevels(subjectId)` для picker уровня при зачислении

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`groups` feature** — список, create/edit модалки, страница группы с `GroupStudentsTable`.
- **`subject-admin`** — список предметов для Select в форме группы.
- **`program-admin.getLevels(subjectId)`** — уровни для picker при зачислении.
- **`GroupStudentsTable`** — база для кнопки «Добавить ученика» и отображения состава.

### Established Patterns
- Server actions + Zod + `requireRoles(['MANAGER', 'SUPER_ADMIN'])` для групп.
- Ant Design Table + Modal для админ-списков (как `SubjectsList`, `GroupsList`).
- Phase 10: subject-scoped levels via `@@unique([subjectId, number])`.

### Integration Points
- **Prisma:** `Group` + `subjectId`; новая junction; удаление `Student.groupId`; пересмотр `Student.levelId` (вероятно удалить с Student, перенести на junction).
- **User creation flow** — `createUsers` требует `groupId` для STUDENT; нужна стратегия без поломки bulk-create.
- **Journal / API** — пока читают `student.groupId`; полный subject-scoped журнал — Phase 13, но planner должен отметить временные зависимости или минимальные адаптеры.
- **E2E** — обновить тесты групп и зачисления при смене модели.

</code_context>

<specifics>
## Specific Ideas

- UX зачисления как сейчас на странице группы, но ученик может состоять в нескольких группах.
- Список групп: сразу видно предмет + можно отфильтровать.
- Предмет группы — решение на всю жизнь группы (как программа предмета не переносится).

</specifics>

<deferred>
## Deferred Ideas

- Прогресс ученика по предмету (`StudentSubjectProgress`, `currentStepIdx` per subject) — Phase 12
- Сессии и completions в скоупе предмета — Phase 12
- Журнал: автоматический предмет из группы — Phase 13
- Детальная стратегия миграции prod-данных — на усмотрение planner (пользователь не выбирал отдельную область «миграция»)

</deferred>

---

*Phase: 11-Groups & Enrollment*
*Context gathered: 2026-07-07*
