---
phase: 260716-mop-journal-mobile
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/journal/ui/StudentList.tsx
  - src/features/journal/ui/JournalStudentsTable.tsx
  - src/features/journal/ui/lesson/LessonPageHeader.tsx
  - src/features/journal/ui/lesson/LessonSaveBar.tsx
  - src/features/analytics/ui/StudentMetricsCards.tsx
autonomous: true
requirements:
  - QUICK-MOP-01
must_haves:
  truths:
    - "На ширине <768px шапка списка Журнал (заголовок, группа, дата) не выходит за экран и не требует горизонтального скролла страницы"
    - "Таблица учеников на мобилке остаётся кликабельной; второстепенные колонки скрыты или доступны через горизонтальный скролл таблицы"
    - "Страница урока: шапка и кнопки сохранения читаемы и нажимаемы одним пальцем без обрезания текста"
  artifacts:
    - src/features/journal/ui/StudentList.tsx
    - src/features/journal/ui/JournalStudentsTable.tsx
    - src/features/journal/ui/lesson/LessonPageHeader.tsx
    - src/features/journal/ui/lesson/LessonSaveBar.tsx
  key_links:
    - "StudentList toolbar → Tailwind flex-col/sm:flex-row (как JournalHistoryPage)"
    - "JournalStudentsTable columns → antd responsive breakpoint"
    - "LessonSaveBar → flex-col на xs, flex-row от sm; md:left-[240px] сохранить"
---

<objective>
Адаптировать экран Журнал учителя под мобильные: список учеников (группа/дата/таблица) и страница урока (шапка + панель сохранения) — через Tailwind breakpoints и Ant Design responsive props, без смены архитектуры.

Purpose: Учитель на телефоне может выбрать группу/день, открыть ученика и сохранить урок без горизонтального скролла всей страницы и без обрезанных кнопок.
Output: Responsive StudentList + JournalStudentsTable + LessonPageHeader + LessonSaveBar (+ compact metrics).
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/quick/260625-m6v-mobile/260625-m6v-SUMMARY.md
@src/features/journal/ui/StudentList.tsx
@src/features/journal/ui/JournalStudentsTable.tsx
@src/features/journal/ui/JournalHistoryPage.tsx
@src/features/journal/ui/lesson/LessonPageHeader.tsx
@src/features/journal/ui/lesson/LessonSaveBar.tsx
@src/features/analytics/ui/StudentMetricsCards.tsx
@src/shared/lib/use-breakpoint.ts
@.cursor/rules/antd-no-style-overrides.mdc
@.cursor/rules/no-antd-flex.mdc
</context>

<tasks>

<task type="auto">
  <name>Task 1: Адаптивная шапка и таблица списка Журнал</name>
  <files>src/features/journal/ui/StudentList.tsx, src/features/journal/ui/JournalStudentsTable.tsx</files>
  <action>
Адаптировать список `/journal` под &lt;768px по образцу `JournalHistoryPage` (уже есть `flex-col sm:flex-row`).

StudentList.tsx:
- Заменить горизонтальный блок заголовка (`flex items-center justify-between` без wrap) на колонку на xs и ряд от `sm:`: заголовок сверху, ниже контролы (группа + дата) на всю ширину.
- Select группы: `className="w-full sm:min-w-[220px]"` вместо фиксированного `min-w-[220px]` (per D-style pattern из JournalHistoryPage).
- Ряд стрелок + JournalDatePicker: `w-full sm:w-auto`, DatePicker растягивать на мобилке (`className` / обёртка `flex-1` где нужно), без горизонтального overflow страницы.
- Title оставить antd `Title level={3}` без цветовых/типографических Tailwind-override (правило antd-no-style-overrides). Layout-only классы на обёртках `div` — ок.
- Не трогать логику даты/группы/урока/фильтра посещаемости.

JournalStudentsTable.tsx:
- Сохранить `scroll={{ x: "max-content" }}` как fallback.
- На колонках ниже приоритета добавить antd `responsive: ["md"]` (или `["sm"]` — выбрать единообразно md=768, согласованно с `useIsMobile`): скрыть на узком экране «Риск-сигналы», «Пройдено сегодня», «Оценки»; оставить видимыми «Ученик», «Посещаемость», «Текущий шаг».
- Не переписывать таблицу на карточки; не использовать неиспользуемый `StudentCard.tsx` (устарел: нет date/groupId в URL).
- Не менять обработчики клика по строке / паузы.
- Layout только через `div` + Tailwind; не добавлять antd `Flex` (правило no-antd-flex).
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit</automated>
  </verify>
  <done>
На viewport &lt;768px шапка Журнала складывается вертикально без overflow страницы; в таблице видны имя/посещаемость/шаг; остальные колонки скрыты через responsive или доступны через scroll таблицы.
  </done>
</task>

<task type="auto">
  <name>Task 2: Мобильная страница урока — шапка и сохранение</name>
  <files>src/features/journal/ui/lesson/LessonPageHeader.tsx, src/features/journal/ui/lesson/LessonSaveBar.tsx, src/features/analytics/ui/StudentMetricsCards.tsx</files>
  <action>
Сделать страницу `/journal/[studentId]` удобной на телефоне.

LessonPageHeader.tsx:
- Блок аватар+имя+ссылка «История шагов»: на xs — `flex-col items-start`, от `sm:` — горизонтальный `justify-between` как сейчас.
- Длинный secondary-текст (уровень/шаг/часы) должен переноситься (`min-w-0` на текстовом контейнере), без горизонтального скролла.
- Ссылку «История шагов» на мобилке сделать полной шириной или отдельной строкой под именем (Button `block` на xs опционально через обёртку), не обрезать.
- Не менять props/данные; не трогать NormWarningAlert / LessonStepsSection.

LessonSaveBar.tsx:
- Сохранить `fixed` и `md:left-[240px]` (сайдбар с md из AppShell / предыдущий quick 260625-m6v).
- Внутренний ряд кнопок: `flex flex-col gap-2 sm:flex-row` — на мобилке кнопки друг под другом на всю ширину (`block` уже есть).
- Если имя следующего ученика длинное: в подписи «Сохранить и перейти к …» на узком экране укоротить (например первые слова / ellipsis через CSS `truncate` на тексте или сокращённая фраза «Сохранить и далее»), не ломая desktop-подпись.
- Не менять callbacks `onSave` / `onSaveAndNext`.

StudentMetricsCards.tsx (variant compact, используется в LessonPageHeader):
- Заменить жёсткий `grid-cols-3` на `grid-cols-1 gap-3 sm:grid-cols-3` (или `grid-cols-3` с меньшим gap и `min-w-0` на ячейках — предпочтительно 1→3 колонки, чтобы Statistic «Время обучения» не сжимался).
- Variant `portal` не ломать (уже responsive).
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit</automated>
  </verify>
  <done>
На &lt;768px шапка урока и метрики читаются без обрезания; панель «Сохранить» / «Сохранить и перейти» — вертикальный стек с полноценными touch-target; на desktop layout без регрессий.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| UI layout only | Нет новых API/мутаций; только CSS/responsive props на существующих journal-экранах |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mop-01 | Information Disclosure | JournalStudentsTable column hide | low | accept | Скрытие колонок — UX; данные по-прежнему в DOM/API как до изменений |
| T-mop-02 | Tampering | LessonSaveBar buttons | low | accept | Только layout; handlers без изменений |
| T-mop-SC | Tampering | npm installs | low | accept | Новых пакетов нет |
</threat_model>

<verification>
- `pnpm exec tsc --noEmit` проходит
- Ручная проверка в DevTools: iPhone SE / 375px и 768px+
  1. `/journal` — заголовок, Select группы, дата без горизонтального скролла страницы
  2. Таблица — клик по ученику открывает урок; на узком экране нет обязательного скролла всей страницы из-за лишних колонок
  3. `/journal/[studentId]` — шапка, метрики, нижняя панель сохранения usable
</verification>

<success_criteria>
- Список Журнал и страница урока usable на ширине ~375px без горизонтального скролла страницы
- Desktop (≥768px) визуально без регрессий относительно текущего layout
- Архитектура FSD / server actions / data flow не менялись
</success_criteria>

<output>
Create `.planning/quick/260716-mop-journal-mobile/260716-mop-SUMMARY.md` when done
</output>
