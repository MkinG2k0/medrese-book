---
phase: 260722-jxy-1-3-5-3-4-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/lib/step-completion.ts
  - src/shared/lib/validations/extra-assignment.ts
  - src/shared/lib/validations/session.ts
  - src/shared/lib/validations/step-completion.ts
  - src/features/journal/model/use-lesson-page.ts
  - src/shared/lib/student-progress/recalculate.test.ts
  - src/features/journal/ui/StepCard.tsx
  - src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx
  - src/features/journal/ui/StepHistoryPage.tsx
  - src/features/student-portal/ui/StudentSessionsTable.tsx
  - src/features/student-portal/ui/StudentLessonsList.tsx
  - src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx
  - src/features/analytics/ui/StudentStudyHistoryModal.tsx
  - src/features/audit-log/lib/format-audit-entity.ts
  - prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql
autonomous: true
requirements:
  - QUICK-grade-scale-3-4-5
user_setup: []

must_haves:
  truths:
    - "В журнале и допзаданиях кнопки Средне / Хорошо / Отлично сохраняют значения 3 / 4 / 5 (подписи не меняются)"
    - "PASSING_GRADE равен 3 — минимальная оценка шкалы считается прохождением шага"
    - "Zod и типы принимают только 3|4|5; старые литералы шкалы 1|3|5 в валидации/UI-опциях отсутствуют"
    - "Существующие строки StepCompletion и ExtraAssignmentCompletion с оценками старой шкалы перемаплены: бывшая «Средне»→3, «Хорошо»→4, «Отлично»→5"
    - "Формулы усреднения аналитики не переписываются вручную — меняются только входные значения оценок"
  artifacts:
    - path: src/shared/lib/step-completion.ts
      provides: "PASSING_GRADE = 3"
    - path: src/shared/lib/validations/extra-assignment.ts
      provides: "grade z.union literals 3|4|5"
    - path: src/shared/lib/validations/session.ts
      provides: "completions.grade только 3|4|5"
    - path: src/shared/lib/validations/step-completion.ts
      provides: "update grade только 3|4|5"
    - path: prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql
      provides: "CASE-remap grade на StepCompletion и ExtraAssignmentCompletion"
  key_links:
    - from: GRADE_OPTIONS value
      to: StepCompletion.grade / ExtraAssignmentCompletion.grade
      via: "session API + journal save + extra-assignment grade"
    - from: PASSING_GRADE
      to: isPassingGrade / sync-for-progress
      via: "grade >= PASSING_GRADE"
    - from: migration CASE
      to: GRADE_LABEL maps keys 3/4/5
      via: "после migrate deploy старые 1/3 читаются как 3/4"
---

<objective>
Сменить числовую шкалу оценок с 1 / 3 / 5 на 3 / 4 / 5 при сохранении подписей Средне / Хорошо / Отлично, порога прохождения и согласованных Zod/UI/лейблов; перемапить существующие оценки в БД.

Purpose: Единая шкала ближе к привычной «тройке–пятёрке»; «Средне» остаётся минимальным проходом.

Output: обновлённые опции/валидация/PASSING_GRADE, UI-лейблы, Prisma data migration, зелёный unit-тест recalculate.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/lib/step-completion.ts
@src/shared/lib/validations/extra-assignment.ts
@src/shared/lib/validations/session.ts
@src/shared/lib/validations/step-completion.ts
@src/features/journal/ui/StepCard.tsx
@src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx
@src/features/journal/ui/StepHistoryPage.tsx
@prisma/schema.prisma
</context>

## Scope

- Числовые значения: Средне=3, Хорошо=4, Отлично=5.
- Подписи без изменений: Средне / Хорошо / Отлично.
- PASSING_GRADE: было 1 → станет 3 (новый минимум шкалы).
- Data migration обязательна: старые оценки в БД CASE-remap (см. Task 3). Порядок обновления критичен — не делать два отдельных UPDATE подряд по равенству.
- Не трогать формулы averaging в analytics (кроме естественного сдвига из новых чисел).
- Не менять e2e, которые кликают по тексту «Средне» (лейблы те же).
- prisma/seed-e2e.ts и prisma/lib/seed-history.ts уже с PASSING_GRADE=3 — не ломать; при необходимости только убедиться, что seed по-прежнему пишет проходную оценку согласованно с новым минимумом.

## Mapping

| Label   | Old | New |
|---------|-----|-----|
| Средне  | 1   | 3   |
| Хорошо  | 3   | 4   |
| Отлично | 5   | 5   |

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | Шкала оценок 3/4/5 вместо 1/3/5 | COVERED — Tasks 1–3 |
| REQ | QUICK-grade-scale-3-4-5 | COVERED — Tasks 1–3 |
| RESEARCH | (нет research phase; codebase_findings от оркестратора) | COVERED |
| CONTEXT | UI options, label maps, validation, PASSING_GRADE, tests, data migration | COVERED |
| Deferred | — | none |
| Out of scope | Перепись averaging math; смена текстовых лейблов; seed PASSING_GRADE уже 3 | excluded |

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Контракт шкалы — PASSING_GRADE, Zod, типы, тест</name>
  <files>src/shared/lib/step-completion.ts, src/shared/lib/validations/extra-assignment.ts, src/shared/lib/validations/session.ts, src/shared/lib/validations/step-completion.ts, src/features/journal/model/use-lesson-page.ts, src/shared/lib/student-progress/recalculate.test.ts</files>
  <read_first>
    - src/shared/lib/step-completion.ts — текущий PASSING_GRADE и isPassingGrade
    - src/shared/lib/validations/extra-assignment.ts — grade z.union literals
    - src/shared/lib/validations/session.ts — completions.grade min/max
    - src/shared/lib/validations/step-completion.ts — updateStepCompletionSchema.grade
    - src/features/journal/model/use-lesson-page.ts — cast localGrade as union
    - src/shared/lib/student-progress/recalculate.test.ts — fixtures с grade как «минимальный проход»
  </read_first>
  <behavior>
    - isPassingGrade(3) === true; isPassingGrade(null) === false; значения ниже нового PASSING_GRADE не считаются проходом
    - Zod extra-assignment / session completions / step-completion update принимают 3, 4, 5 и отклоняют любое другое целое (включая устаревший минимум шкалы и промежуточные 2)
    - recalculate.test использует минимальную проходную оценку новой шкалы (3) там, где раньше стоял старый минимум как «passed»
  </behavior>
  <action>
    1. В `src/shared/lib/step-completion.ts` выставить `PASSING_GRADE` в 3 (новый минимум шкалы). Не менять сигнатуру `isPassingGrade`.
    2. Во всех трёх Zod-схемах (`extra-assignment.ts`, `session.ts`, `step-completion.ts`) заменить grade на `z.union([z.literal(3), z.literal(4), z.literal(5)])` для единообразия (не оставлять широкий min/max диапазон).
    3. В `use-lesson-page.ts` заменить union-cast оценки на `3 | 4 | 5`.
    4. В `recalculate.test.ts` заменить фикстуры, где grade означает «пройдено минимальной оценкой», на 3. Не менять логику recalculate.
    5. Не трогать analytics averaging helpers. Не трогать UI-файлы в этой задаче.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/student-progress/recalculate.test.ts; rg -n "PASSING_GRADE\s*=" src/shared/lib/step-completion.ts; rg -n "z\.literal\(3\).*z\.literal\(4\).*z\.literal\(5\)|z\.literal\(3\),\s*z\.literal\(4\),\s*z\.literal\(5\)" src/shared/lib/validations/extra-assignment.ts src/shared/lib/validations/session.ts src/shared/lib/validations/step-completion.ts</automated>
  </verify>
  <done>
    PASSING_GRADE=3; три Zod-схемы принимают только 3|4|5; use-lesson-page cast 3|4|5; recalculate.test зелёный с grade 3 как минимальным проходом.
  </done>
</task>

<task type="auto">
  <name>Task 2: UI-опции и карты подписей 3/4/5</name>
  <files>src/features/journal/ui/StepCard.tsx, src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx, src/features/journal/ui/StepHistoryPage.tsx, src/features/student-portal/ui/StudentSessionsTable.tsx, src/features/student-portal/ui/StudentLessonsList.tsx, src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx, src/features/analytics/ui/StudentStudyHistoryModal.tsx, src/features/audit-log/lib/format-audit-entity.ts</files>
  <read_first>
    - src/features/journal/ui/StepCard.tsx — GRADE_OPTIONS
    - src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx — GRADE_OPTIONS
    - src/features/journal/ui/StepHistoryPage.tsx — GRADE_OPTIONS + GRADE_LABEL
    - пять файлов с Record&lt;number,string&gt; картами подписей (student-portal ×3, analytics modal, audit-log)
  </read_first>
  <action>
    1. В трёх местах с GRADE_OPTIONS (StepCard, SessionExtraAssignmentCard, StepHistoryPage) выставить числовые value: Средне→3, Хорошо→4, Отлично→5. Тексты label не менять.
    2. Во всех картах подписей (StepHistoryPage GRADE_LABEL, StudentSessionsTable, StudentLessonsList, StudentExtraAssignmentsHistory, StudentStudyHistoryModal, format-audit-entity) ключи Record сделать 3→Средне, 4→Хорошо, 5→Отлично. Сохранить fallback `?? grade` / `?? String(grade)` где он уже есть.
    3. Не вводить общий shared-модуль констант в этой quick-задаче (discretion: точечные правки по существующему дублированию). Не менять стили кнопок и layout.
    4. После правок по репозиторию не должно остаться UI-опций/карт, где «Средне» привязано к числовому ключу/value старого минимума шкалы, а «Хорошо» — к тройке.
  </action>
  <verify>
    <automated>rg -n "GRADE_OPTIONS|GRADE_LABEL" src/features/journal/ui/StepCard.tsx src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx src/features/journal/ui/StepHistoryPage.tsx src/features/student-portal/ui/StudentSessionsTable.tsx src/features/student-portal/ui/StudentLessonsList.tsx src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx src/features/analytics/ui/StudentStudyHistoryModal.tsx src/features/audit-log/lib/format-audit-entity.ts; rg -n "Средне" src/features/journal/ui/StepCard.tsx src/features/extra-assignments/ui/SessionExtraAssignmentCard.tsx src/features/journal/ui/StepHistoryPage.tsx | rg "3"</automated>
  </verify>
  <done>
    Все GRADE_OPTIONS и label-maps используют 3/4/5 при тех же русских подписях; сохранение из журнала/допзаданий пишет новые числа.
  </done>
</task>

<task type="auto">
  <name>Task 3: Prisma data migration remap оценок</name>
  <files>prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql</files>
  <read_first>
    - prisma/schema.prisma — модели StepCompletion и ExtraAssignmentCompletion (поле grade Int)
    - любая недавняя prisma/migrations/*/migration.sql — стиль именования и SQL
  </read_first>
  <action>
    1. Создать каталог миграции `prisma/migrations/20260722120000_remap_grade_scale_3_4_5/` с `migration.sql` (только data, без изменения schema.prisma).
    2. В одном UPDATE на таблицу `"StepCompletion"` и одном на `"ExtraAssignmentCompletion"` перемапить grade через CASE в одном проходе: старый минимум шкалы (бывшая «Средне») → 3; бывшая «Хорошо» (тройка) → 4; пятёрка остаётся пятёркой. WHERE ограничить строками, где grade IN (старый минимум, тройка) — чтобы не трогать уже корректные 4/5 после частичного прогона.
    3. Критично: не делать последовательные UPDATE вида «сначала все =минимум в 3, потом все =3 в 4» — это испортит только что перемапленные «Средне». Только CASE (или эквивалентный однопроходный remap).
    4. Schema Prisma не менять (Int без enum). Не трогать seed-файлы, если они уже пишут PASSING_GRADE=3 как проход.
    5. В SUMMARY после выполнения кратко зафиксировать impact: средние в аналитике вырастут (старые «Средне»/«Хорошо» стали 3/4); после `pnpm db:migrate` / `db:migrate:deploy` на окружении исторические лейблы совпадут с новой картой.
  </action>
  <verify>
    <automated>Test-Path prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql; rg -n "StepCompletion|ExtraAssignmentCompletion|CASE" prisma/migrations/20260722120000_remap_grade_scale_3_4_5/migration.sql</automated>
  </verify>
  <done>
    SQL-миграция существует, однопроходный CASE-remap для обеих таблиц с оценками; schema.prisma без изменений.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → API grade field | Недоверенное число оценки в session / step-completion / extra-assignment payloads |
| Migration → DB rows | Одноразовый data rewrite исторических оценок |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-jxy-01 | Tampering | Zod grade on session/step-completion/extra-assignment | medium | mitigate | Только literals 3\|4\|5; отклонение прочих значений на API |
| T-jxy-02 | Tampering | Data migration CASE order | high | mitigate | Однопроходный CASE; запрет двухшаговых UPDATE по равенству |
| T-jxy-03 | Information Disclosure | Grade labels in portal/audit | low | accept | Те же подписи, меняются только числа; RBAC без изменений |
| T-jxy-SC | Tampering | npm installs | low | accept | Новых пакетов нет |
</threat_model>

<verification>
- vitest recalculate.test.ts проходит
- UI options и label maps: 3/4/5
- PASSING_GRADE=3
- migration.sql с CASE на StepCompletion и ExtraAssignmentCompletion
- Нет правок averaging-формул analytics
</verification>

<success_criteria>
- Новые оценки сохраняются как 3/4/5 с подписями Средне/Хорошо/Отлично
- Минимальная оценка шкалы проходит шаг (PASSING_GRADE=3)
- Исторические строки после migrate читаются с корректными лейблами
- Impact note в SUMMARY: сдвиг средних в аналитике ожидаем
</success_criteria>

<output>
Create `.planning/quick/260722-jxy-1-3-5-3-4-5/260722-jxy-SUMMARY.md` when done
</output>
