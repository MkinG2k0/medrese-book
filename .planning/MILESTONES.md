# Milestones

## v2.0 Система предметов (Shipped: 2026-07-11)

**Phases completed:** 6 phases, 27 plans, 81 tasks

**Key accomplishments:**

- Subject model, prod-safe Level.subjectId migration with Quran backfill, and Zod validation foundations
- Админка предметов: server actions с guard удаления, таблица с модалками на /admin/subjects, пункт меню «Предметы»
- Server-слой программы с subjectId-скоупом, deleteLevel, per-subject offsets и удалением legacy /admin/program
- Subject-scoped program editor at /admin/subjects/[subjectId]/program with modal level create, deleteLevel, breadcrumbs, and Tiptap step save redirects
- Параметризованный seed с тремя предметами: полная программа Корана, компактные программы Таджвида и арабского; ученики остаются на уровнях Корана.
- Group.subjectId, junction GroupEnrollment с prod-backfill и Zod-валидации зачисления (Wave 0 unit-тесты)
- Группы привязаны к предметам в CRUD и UI: обязательный subjectId при создании, read-only при редактировании, список с колонкой и фильтром; getGroup/getMyGroup на enrollments
- Complete
- Journal, API auth и analytics read-paths переведены на GroupEnrollment без Student.groupId; interim primary enrollment по enrolledAt asc
- Seed-скрипты переведены на Group.subjectId и GroupEnrollment; demo и E2E сиды проходят без ошибок
- Admin-потоки переведены на GroupEnrollment: создание с зачислением, read-only группа/уровень в модалке, каскад уровней по предмету группы
- Group-scoped progress on GroupEnrollment, Session.groupId with prod-safe backfill, and Zod session contract requiring groupId
- recalculateStudentStepIdx and syncCompletionsForProgress rewritten for GroupEnrollment scope with Vitest coverage
- POST/GET sessions, step-completions recalculate, and journal-actions wired to GroupEnrollment progress with groupId
- Students API, student-admin, group enrollment, and user-admin wired to GroupEnrollment.currentStepIdx with groupId context
- Planning docs и seed синхронизированы с D-01: прогресс на GroupEnrollment, сессии с groupId, SUBJ-08…10 закрыты
- URL/storage contracts for groupId, getTeacherGroups with subject labels, and useJournalDate hook syncing group context
- Ant Design group Select on /journal with enrollment-scoped student list and groupId preserved in lesson links
- Страница урока с обязательным groupId: assertTeacherOwnsGroup на сервере, шапка «Группа · Предмет», навигация сохраняет контекст группы
- Independent history group picker, mandatory groupId on step history, E2E groupId assertions, deprecated getTeacherGroup removed
- Subject picker on /analytics with URL-scoped subjectId, role-filtered subject list, and placeholder gate blocking mixed-subject metrics until 14-02
- Top, level stats, and at-risk metrics on /analytics filtered by mandatory subjectId with Prisma group.subjectId scope and worst-case enrollment selection
- GET step-completions и модалка истории учёбы фильтруют completions по session.group.subjectId; journal path без subjectId сохранён
- Дашборд `/student/me` с карточками per GroupEnrollment, subject-scoped прогрессом и метриками месяца
- Навигация ученика с groupId в URL: scoped lessons/history, deep links с карточек, primary enrollment fallback
- Допзадания фильтруются по предмету через Step.level.subjectId — в справочнике и при назначении на уроке
- История допзаданий ученика на /student/extra-assignments с группировкой по предмету и расширенным history API для роли STUDENT

**Closeout:** verified_closeout (all phases verified passed)  
**Known verification overrides:** 18 quick-task artifacts without SUMMARY.md acknowledged at close — see STATE.md Deferred Items

---
