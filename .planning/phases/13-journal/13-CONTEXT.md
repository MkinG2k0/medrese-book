# Phase 13: Journal - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 13 доставляет **UI журнала учителя с выбором группы и уроком в контексте предмета группы**:

- Селектор группы на главной странице журнала; предмет определяется автоматически из `Group.subjectId` (SUBJ-11)
- Список учеников показывает прогресс **per GroupEnrollment** выбранной группы (SUBJ-12)
- Страница урока: оценки по шагам программы предмета группы, посещаемость, таймер — в контексте `groupId` (SUBJ-13)
- Замена tech debt `getTeacherGroup()` (`findFirst`) на полноценный выбор группы
- Страницы истории (`/journal/history`, `/journal/[studentId]/history`) работают с явным контекстом группы

**Вне скоупа фазы 13:** аналитика по предмету (Phase 14), портал ученика (Phase 15), изменения data model / API contracts (Phase 12), CRUD групп и зачислений (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Селектор группы
- **D-01:** Размещение — **в шапке журнала, в одной строке с выбором даты** (правая часть `StudentList`, рядом с `JournalDatePicker`).
- **D-02:** Список групп — **только свои** (`group.teacherId = текущий учитель`). Группы замещаемых учителей **не показывать** в селекторе.
- **D-03:** Группа по умолчанию — **последняя выбранная** (localStorage). При первом визите — первая доступная группа.
- **D-04:** UI-компонент — **Ant Design Select** (как фильтр на `/groups`).
- **D-05:** Заменить `getTeacherGroup()` / `findFirst` на загрузку списка собственных групп учителя с `subject` для подписей в Select.

### Отображение предмета
- **D-06:** Отдельный subject-picker **не нужен**. Название предмета показывается **только внутри опций Select группы**.
- **D-07:** Формат опции Select: **`«Название группы — Предмет»`** (например, «Группа А — Коран»).
- **D-08:** На странице урока (`/journal/[studentId]`) — подпись в **`LessonPageHeader`**: контекст **«Группа · Предмет»** (secondary text).
- **D-09:** Две группы одного предмета (Phase 11 D-10) — **достаточно названия группы**; дополнительных подсказок (уровень, кол-во учеников) не добавлять.

### URL, localStorage и навигация
- **D-10:** `groupId` передаётся в **URL query** (`?groupId=...`) наряду с существующим `date`. localStorage — fallback/дефолт при отсутствии `groupId` в URL.
- **D-11:** Ссылки «Назад», «История шагов» и возврат со страницы урока **сохраняют `groupId` + `date`** (расширить `journal-url.ts` / `journalBackHref`).

### Страницы истории
- **D-12:** `/journal/history` — **свой Select группы** на странице (не наследует контекст главного журнала автоматически).
- **D-13:** `/journal/[studentId]/history` — **обязательный `groupId` в URL**; прогресс шагов в контексте зачисления.
- **D-14:** localStorage для истории — **отдельный ключ** от главного журнала (независимый дефолт группы на `/journal/history`).

### Claude's Discretion
- Имена ключей localStorage и точная синхронизация URL ↔ storage при смене Select.
- Пустое состояние «нет групп» / «группа не назначена» — текст и CTA.
- Поведение при смене группы во время активного teaching session (таймер): предупреждение или тихое переключение контекста.
- Доступ менеджера к журналу (если маршрут уже открыт) — вне обсуждения; не расширять скоуп без необходимости.
- Обновление E2E (`e2e/journal.spec.ts`) под `groupId` в URL.
- Success criteria ROADMAP п.4 («subjectId») — реализовать через `groupId` + `group.subjectId` (Phase 12 D-04); не вводить отдельный subject scope в UI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements
- `.planning/PROJECT.md` — milestone v2.0, журнал по группе
- `.planning/REQUIREMENTS.md` — SUBJ-11, SUBJ-12, SUBJ-13
- `.planning/ROADMAP.md` — Phase 13 goal and success criteria

### Prior phase context
- `.planning/phases/12-progress-sessions/12-CONTEXT.md` — прогресс per GroupEnrollment, Session по groupId
- `.planning/phases/11-groups-enrollment/11-CONTEXT.md` — Group.subjectId, мульти-группы, levelId на enrollment

### Journal feature (текущая реализация)
- `src/app/(dashboard)/journal/page.tsx` — entry, сейчас `getTeacherGroup()` findFirst
- `src/features/journal/ui/StudentList.tsx` — шапка с датой, таймер, таблица учеников
- `src/features/journal/actions/journal-actions.ts` — `getTeacherGroup`, `getStudentLesson(groupId?)`
- `src/features/journal/lib/journal-url.ts` — `date` query param; расширить под `groupId`
- `src/features/journal/ui/lesson/LessonPageHeader.tsx` — добавить контекст группы/предмета
- `src/app/(dashboard)/journal/history/page.tsx` — история группы
- `src/app/(dashboard)/journal/[studentId]/history/page.tsx` — история шагов ученика

### API & entities
- `src/app/api/students/route.ts` — список учеников по `groupId`, enrollment progress
- `src/entities/student/api/use-students.ts` — React Query с `groupId`
- `src/app/api/teaching-sessions/route.ts` — таймер урока per `groupId`
- `src/shared/lib/group-access.ts` — `canAccessGroupAsTeacher` (замещение; в UI селектора не используется per D-02)

### Groups reference (паттерн Select)
- `src/features/groups/ui/GroupsList.tsx` — фильтр по предмету, Ant Design Select

### E2E
- `e2e/journal.spec.ts` — обновить под выбор группы / URL params
- `e2e/helpers/journal.ts` — хелперы старта урока

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`StudentList`** — уже принимает `groupId`; добавить Select и проброс из page/URL.
- **`useStudents(groupId, date)`** — готов к group-scoped списку с enrollment progress.
- **`getStudentLesson(studentId, groupId?)`** — Phase 12 forward-compat; UI должен всегда передавать `groupId`.
- **`journal-url.ts`** — паттерн `date` query; расширить для `groupId` и composite hrefs.
- **`LessonTimerBar` / `useTeachingSession`** — уже scoped по `groupId`.
- **`GroupsList` subject filter** — референс для Ant Design Select с подписями.

### Established Patterns
- Server Component page загружает начальный контекст → Client Component с React Query для интерактива.
- Дата журнала в URL (`?date=YYYY-MM-DD`) через `useJournalDate` — аналогично для `groupId`.
- Прогресс в API: `enrollment.currentStepIdx`, `levelNumber`, `levelTitle` (не global `Student`).

### Integration Points
- **`journal/page.tsx`** — заменить single `getTeacherGroup` на список групп + default из storage/URL.
- **`journal-actions.ts`** — `getTeacherGroups()` для Select; auth paths, использующие `findFirst`, привязать к выбранному `groupId`.
- **`LessonPage` / `journalBackHref`** — preserve `groupId` + `date`.
- **`/journal/history`** — отдельный picker + свой localStorage key.

</code_context>

<specifics>
## Specific Ideas

- Селектор группы визуально в одном ряду с переключателем даты — не отдельный «блок контекста» над заголовком.
- Предмет не дублировать бейджем снаружи Select — только в подписи опции и в шапке урока.
- История занятий и история шагов — независимый выбор группы на `/journal/history`, но явный `groupId` в URL для шагов ученика.

</specifics>

<deferred>
## Deferred Ideas

- **Группы замещаемых учителей в селекторе журнала** — явно отклонено (D-02: только свои группы). Замещение остаётся в API (`canAccessGroupAsTeacher`), но не в UI picker этой фазы.
- **Отдельный subject-picker** — отклонено (SUBJ-11, Phase 11 D-07).
- **URL и пустые состояния** (смена группы при активном таймере) — не обсуждались; на planner/executor (Claude's Discretion).
- **Доступ менеджера к журналу** — не обсуждался.
- **Аналитика по предмету** — Phase 14.
- **Портал ученика** — Phase 15.

</deferred>

---

*Phase: 13-Journal*
*Context gathered: 2026-07-12*
