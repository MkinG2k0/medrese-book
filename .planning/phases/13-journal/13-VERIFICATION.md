---
phase: 13-journal
verified: 2026-07-11T21:40:00Z
status: human_needed
score: 10/13 must-haves verified
behavior_unverified: 3
overrides_applied: 0
behavior_unverified_items:
  - truth: "Таймер урока и сохранение сессии работают с groupId/subjectId выбранной группы"
    test: "На /journal выбрать группу → «Начать урок» → открыть урок ученика → «Сохранить урок»"
    expected: "Teaching session и session POST привязаны к groupId выбранной группы; после сохранения возврат на /journal?date=…&groupId=… той же группы"
    why_human: "Код передаёт groupId в useTeachingSession/useCreateSession, но нет проходящего behavioral-теста (E2E не запускается)"
  - truth: "Смена группы в Select обновляет список учеников с enrollment progress"
    test: "При активном уроке переключить Select с «Группа Аль-Фатиха» на «Группа Аль-Ихлас»"
    expected: "Список учеников меняется (Ali/Usman/Bilal → Khalid/Zayd); колонка «Текущий шаг» отражает enrollment выбранной группы"
    why_human: "React Query refetch по groupId проводен статически; E2E-тест написан, но не выполнен из-за ошибки Playwright config"
  - truth: "E2E journal.spec.ts проходит с assertions на groupId в URL"
    test: "pnpm test:e2e -- e2e/journal.spec.ts (после починки playwright.config.ts)"
    expected: "Все тесты green; beforeEach проверяет groupId в URL; тест смены группы и lesson flow с сохранением groupId"
    why_human: "Тесты написаны и seed-e2e обновлён, но запуск падает: TypeError context.conditions?.includes is not a function в playwright.config.ts"
human_verification:
  - test: "Открыть /journal под teacher1 — проверить Select группы в одной строке с датой"
    expected: "Ant Design Select справа от date picker; опции вида «Группа Аль-Фатиха — …»; при одной группе Select виден, но disabled"
    why_human: "Расположение и визуальная компоновка header row не проверяются grep/тестами"
  - test: "Открыть урок ученика с ?groupId= — проверить LessonPageHeader"
    expected: "Под именем ученика secondary text «{groupName} · {subjectName}»; ссылка «История шагов» ведёт на URL с groupId"
    why_human: "Типографика и расположение secondary text требуют визуальной проверки"
  - test: "Открыть /journal/history — проверить независимый Select группы"
    expected: "Select группы не наследует выбор с /journal; использует отдельный localStorage ключ (journal:history:lastGroupId)"
    why_human: "Независимость дефолта истории от главного журнала — runtime localStorage поведение"
  - test: "При активном уроке попытаться сменить группу в Select"
    expected: "Появляется modal.confirm «Урок идёт в другой группе. Переключить?»; отмена оставляет текущую группу"
    why_human: "Условный modal.confirm при teachingSession.isActive не покрыт unit/E2E тестами"
  - test: "Запустить pnpm test:e2e -- e2e/journal.spec.ts после починки Playwright"
    expected: "Exit code 0; все groupId assertions проходят"
    why_human: "E2E — единственный end-to-end контракт SUBJ-11…13; среда верификатора не смогла загрузить config"
---

# Phase 13: Journal Verification Report

**Phase Goal:** Journal with group selection — teacher selects group, subject derived from group, enrollment progress, lesson page scoped by groupId

**Verified:** 2026-07-11T21:40:00Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Учитель выбирает группу вверху журнала; предмет из группы автоматически (SC1, SUBJ-11) | ✓ VERIFIED | `StudentList.tsx`: Ant Design Select с `options: \`${group.name} — ${group.subjectName}\``; отдельного subject-picker нет; `getTeacherGroups()` включает `subjectName` |
| 2 | Список учеников показывает прогресс per enrollment выбранной группы (SC2, SUBJ-12) | ✓ VERIFIED | `useStudents(groupId, date)` → `GET /api/students?groupId=`; API возвращает `enrollment.currentStepIdx`, `levelNumber`; таблица рендерит «Шаг N» |
| 3 | Урок: оценки по шагам программы предмета группы, посещаемость в контексте enrollment (SC3, SUBJ-13) | ✓ VERIFIED | `getStudentLesson(studentId, date, groupId)` + unit-тесты; `getTotalProgramSteps(enrollment.group.subjectId)`; sessions `where: { groupId: targetGroupId }` |
| 4 | Таймер урока и сохранение сессии scoped по groupId (SC4) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `LessonTimerBar`/`useTeachingSession(groupId, date)`; `useCreateSession` передаёт groupId; sessions API требует groupId — wiring есть, behavioral proof отсутствует |
| 5 | URL ?groupId= + ?date=; localStorage отдельно для журнала и истории (D-10, D-14) | ✓ VERIFIED | `JOURNAL_GROUP_PARAM`, `useJournalDate`, `JOURNAL_HISTORY_GROUP_STORAGE_KEY`; unit-тесты `journal-url.test.ts` (7 pass), `journal-storage.test.ts` (4 pass) |
| 6 | buildJournalHref и навигация сохраняют groupId+date (D-11) | ✓ VERIFIED | `buildJournalHref` unit-тест; `JournalStudentsTable` links; `use-lesson-page.ts` `journalHref("/journal")` |
| 7 | getTeacherGroups — только группы текущего учителя с subjectName (D-02, D-05) | ✓ VERIFIED | `prisma.group.findMany({ where: { teacherId } })` + map subjectName; без `canAccessGroupAsTeacher` |
| 8 | Пустое состояние при отсутствии групп | ✓ VERIFIED | `journal/page.tsx` и `history/page.tsx`: `<Text>Группа не назначена</Text>` при `groups.length === 0` |
| 9 | Страница урока требует groupId; getStudentLesson без findFirst для выбора группы (D-13, D-05) | ✓ VERIFIED | `[studentId]/page.tsx`: `if (!groupId) notFound()`; unit-тесты: foreign groupId → null; `groupEnrollment.findMany({ where: { groupId } })`; `group.findFirst` не вызывается для выбора группы |
| 10 | LessonPageHeader «Группа · Предмет»; ссылки истории/назад с groupId (D-08, D-11) | ✓ VERIFIED | `LessonPageHeader.tsx` L69-70, L89; `use-lesson-page.ts` `journalBackHref: journalHref("/journal")` |
| 11 | /journal/history — независимый Select; /journal/[id]/history — обязательный groupId (D-12, D-13) | ✓ VERIFIED | `useJournalHistoryGroup` + `JOURNAL_HISTORY_GROUP_STORAGE_KEY`; `[studentId]/history/page.tsx`: `if (!groupId) notFound()`; `getStudentStepHistory(studentId, groupId)` |
| 12 | getTeacherGroup полностью удалён из journal feature | ✓ VERIFIED | `rg getTeacherGroup src/features/journal/ src/app/(dashboard)/journal/` — 0 matches (только `getTeacherGroups`) |
| 13 | E2E journal.spec.ts проходит с groupId в URL | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `e2e/journal.spec.ts` содержит `expectJournalUrlHasGroupId`, group switch test, lesson flow; запуск: exit 1 — Playwright config load error |

**Score:** 10/13 truths verified (3 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/journal/lib/journal-url.ts` | groupId param, buildJournalHref, resolveJournalGroupId | ✓ VERIFIED | 44 строки; экспорты и логика substantive |
| `src/features/journal/lib/journal-storage.ts` | Отдельные storage keys | ✓ VERIFIED | Wired в `useJournalDate`, `useJournalHistoryGroup` |
| `src/features/journal/actions/journal-actions.ts` | getTeacherGroups, getStudentLesson(groupId), assertTeacherOwnsGroup | ✓ VERIFIED | getTeacherGroup удалён; findFirst только для next level |
| `src/app/(dashboard)/journal/page.tsx` | SSR getTeacherGroups, empty state | ✓ VERIFIED | Импортирует StudentList с groups[] |
| `src/features/journal/ui/StudentList.tsx` | Group Select в header | ✓ VERIFIED | Select + useJournalDate + useStudents(groupId) |
| `src/features/journal/ui/JournalStudentsTable.tsx` | href с groupId+date | ✓ VERIFIED | journalGroupId prop → buildJournalHref |
| `src/app/(dashboard)/journal/[studentId]/page.tsx` | groupId required | ✓ VERIFIED | notFound без groupId |
| `src/features/journal/ui/lesson/LessonPageHeader.tsx` | «Группа · Предмет» | ✓ VERIFIED | groupName, subjectName props rendered |
| `src/features/journal/ui/JournalHistoryPage.tsx` | Independent group Select | ✓ VERIFIED | useJournalHistoryGroup hook |
| `e2e/journal.spec.ts` | groupId URL assertions | ⚠️ ORPHANED (runtime) | Файл substantive и wired к helpers; не исполняется в среде |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| StudentList Select onChange | useJournalDate setGroupId | handleGroupChange → setGroupId / modal.confirm | ✓ WIRED | URL + localStorage обновляются |
| useStudents(groupId) | GET /api/students?groupId= | React Query fetch | ✓ WIRED | enabled: !!groupId |
| getStudentLesson | enrollment.group.subjectId | getTotalProgramSteps(subjectId) | ✓ WIRED | subject-scoped program steps |
| use-lesson-page journalBackHref | /journal?groupId=&date= | useJournalDate journalHref | ✓ WIRED | allowedGroupIds=[groupId] |
| JournalHistoryPage | JOURNAL_HISTORY_GROUP_STORAGE_KEY | useJournalHistoryGroup | ✓ WIRED | Отдельный ключ от main journal |
| Step history route | getStudentStepHistory(studentId, groupId) | enrollment lookup | ✓ WIRED | backHref с buildJournalHref |
| LessonTimerBar | useTeachingSession(groupId, date) | groupId prop from StudentList | ✓ WIRED | start/end mutations include groupId |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| StudentList | students | useStudents → /api/students?groupId | prisma group.enrollments | ✓ FLOWING |
| JournalStudentsTable | currentStepIdx | API enrollment fields | DB enrollment.currentStepIdx | ✓ FLOWING |
| LessonPage | steps, session | getStudentLesson → prisma | enrollment + subject program | ✓ FLOWING |
| JournalHistoryPage | students | useStudents(selectedGroupId) | Same API, group-scoped | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| journal-url groupId contract | `pnpm test:unit -- src/features/journal/lib/journal-url.test.ts` | 7 tests pass | ✓ PASS |
| journal-storage keys | `pnpm test:unit -- src/features/journal/lib/journal-storage.test.ts` | 4 tests pass | ✓ PASS |
| getStudentLesson groupId ownership | `pnpm test:unit -- src/features/journal/actions/journal-actions.test.ts` | 4 tests pass | ✓ PASS |
| E2E journal groupId flow | `pnpm test:e2e -- e2e/journal.spec.ts` | Playwright config TypeError | ✗ FAIL (env) |

### Probe Execution

Step 7c: SKIPPED — phase does not declare probes; no `scripts/*/tests/probe-*.sh` for journal.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUBJ-11 | 13-01, 13-02, 13-04 | Учитель выбирает группу; предмет из группы | ✓ SATISFIED | Select + getTeacherGroups + subjectName в опциях |
| SUBJ-12 | 13-02, 13-04 | Список учеников — прогресс по предмету группы | ✓ SATISFIED | API enrollment progress; history routes scoped |
| SUBJ-13 | 13-03, 13-04 | Урок в контексте предмета группы | ✓ SATISFIED | getStudentLesson(groupId); lesson route 404 без groupId |

Все три requirement ID из PLAN frontmatter учтены. Orphaned requirements для Phase 13 в REQUIREMENTS.md не обнаружены.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | TBD/FIXME/XXX в journal feature | — | Не найдено |
| JournalStudentsTable.tsx | 109 | `Modal.confirm` (static) | ℹ️ Info | Существующий паттерн; не в scope фазы 13 |

### Human Verification Required

### 1. Визуальная компоновка Select на /journal

**Test:** Открыть `/journal` под teacher1  
**Expected:** Select группы в одной строке с date picker; опции «Группа — Предмет»  
**Why human:** Layout header row не верифицируется статически

### 2. Контекст группы/предмета на странице урока

**Test:** Открыть урок с `?groupId=`  
**Expected:** Secondary text «{groupName} · {subjectName}» под именем ученика  
**Why human:** Визуальное отображение D-08

### 3. Независимый выбор группы на /journal/history

**Test:** Выбрать группу на /journal, затем открыть /journal/history  
**Expected:** История не наследует группу автоматически; свой Select и localStorage ключ  
**Why human:** Runtime localStorage поведение

### 4. Modal при смене группы во время активного урока

**Test:** Начать урок → сменить группу в Select  
**Expected:** modal.confirm с предупреждением; отмена сохраняет группу  
**Why human:** Условное поведение не покрыто тестами

### 5. E2E regression

**Test:** `pnpm test:e2e -- e2e/journal.spec.ts` после починки Playwright config  
**Expected:** Green run с groupId assertions  
**Why human:** Config load error блокирует автоматический прогон

### Gaps Summary

Блокирующих пробелов в реализации не обнаружено: все артефакты существуют, substantive и подключены. Фаза не получает статус `passed`, потому что три behavior-dependent truth (таймер/сессия, смена группы, E2E green) не подтверждены runtime-тестами — E2E написан, но среда не смогла загрузить `playwright.config.ts`. Рекомендуется human verification UI и прогон E2E в CI/локально после починки Playwright.

---

_Verified: 2026-07-11T21:40:00Z_  
_Verifier: Claude (gsd-verifier)_
