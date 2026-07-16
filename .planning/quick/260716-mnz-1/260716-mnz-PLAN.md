---
phase: 260716-mnz-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - pnpm-lock.yaml
  - prisma/import-level1-teacher-book.ts
  - prisma/lib/program-import-utils.ts
  - prisma/lib/seed-program.ts
  - prisma/data/level1-teacher-notes.json
  - public/uploads/program/level1/
autonomous: true
requirements:
  - QUICK-MNZ-01
must_haves:
  truths:
    - "После pnpm db:seed:program:force у всех 33 шагов уровня 1 в БД заполнен teacherNote из книги учителя (текст + image-блоки)"
    - "content шагов уровня 1 по-прежнему из buildContent(metadata level1-page*.json); title/hours/order не перезаписываются из docx"
    - "Картинки шагов лежат в public/uploads/program/level1/step-{N}/ и открываются по URL /uploads/program/level1/step-{N}/{file}"
    - "Файлы «пройденные слова» и «نْ в амма джузе» не импортируются"
  artifacts:
    - prisma/import-level1-teacher-book.ts
    - prisma/data/level1-teacher-notes.json
    - public/uploads/program/level1/step-1/
    - prisma/lib/program-import-utils.ts
    - prisma/lib/seed-program.ts
  key_links:
    - "import script → level1-teacher-notes.json + public/uploads/..."
    - "loadAllLevel1Steps merge teacherNote by order → StepDef.teacherNote"
    - "seedProgram upsert create/update пишет teacherNote в Step"
    - "BlockRenderer image.url = /uploads/program/level1/step-N/..."
---

<objective>
Обновить сидер программы 1-го уровня: импортировать книгу учителя (33 docx) в `teacherNote` с изображениями, сохранив student-facing `content` из существующих metadata JSON.

Purpose: Учитель в журнале видит полноценные методические материалы шага (текст + схемы), а ученик — краткое содержание из таблицы программы.
Output: one-shot import-скрипт, `level1-teacher-notes.json`, медиа в `public/uploads/program/level1/`, seed upsert `teacherNote`.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@prisma/seed-program.ts
@prisma/lib/seed-program.ts
@prisma/lib/program-import-utils.ts
@prisma/lib/level1-import-utils.ts
@prisma/data/level1-page1.json
@src/shared/lib/validations/step.ts
@prisma/schema.prisma
@src/features/journal/ui/StepCard.tsx
@src/features/program-admin/ui/BlockRenderer.tsx
@package.json

# Locked decisions (Claude discretion / user skipped --discuss)
# D-01: Полный текст книги учителя → teacherNote; metadata → content через buildContent
# D-02: title / hours / order / lesson / letters / task брать из level1-page*.json (не из docx)
# D-03: Медиа в public/uploads/program/level1/step-{N}/; коммитить PNG/JPEG/SVG(образовательные); EMF без конвертации — skip + log
# D-04: Вычищать Word-мусор (строки почти из одних цифр / размеров drawing)
# D-05: Игнорировать non-step docx («пройденные слова», «نْ в амма джузе»)

# Source (Windows, Cyrillic) — pass via CLI, do not rely on console encoding:
# D:\Data\Таблица шагов\1й ур. .48ч\1 уровень 1.12.25г\Книга учителя
# Step files: «1й шаг..docx» … «33й шаг..docx» (regex: /^(\d+)й\s+шаг/i on basename)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Import-скрипт книги учителя → JSON + медиа</name>
  <files>package.json, pnpm-lock.yaml, prisma/import-level1-teacher-book.ts, prisma/data/level1-teacher-notes.json, public/uploads/program/level1/</files>
  <read_first>
    - prisma/lib/program-import-utils.ts (StepDef, buildContent)
    - src/shared/lib/validations/step.ts (ContentBlock: text|arabic|image|list)
    - package.json (scripts, sharp already in dependencies)
  </read_first>
  <action>
Добавить `jszip` как **devDependency** (portable unzip docx=zip; Node без встроенного unzip). Не добавлять mammoth.

Создать `prisma/import-level1-teacher-book.ts` (tsx one-shot):

1. Источник: CLI `--source "PATH"` (обязателен или с дефолтом на путь из context). На Windows с кириллицей использовать `path`/`fs` Node API, не PowerShell Expand-Archive как основной путь. Per D-05: брать только файлы, чьё имя матчит шаг (`/^(\d+)й\s+шаг/i` на basename); остальные docx — skip + log.

2. Для каждого шага N=1..33:
   - Открыть docx через JSZip.
   - Извлечь `word/media/*` в `public/uploads/program/level1/step-{N}/` (создать dirs).
   - Расширения: `.png`/`.jpeg`/`.jpg` — сохранить как есть; `.svg` — сохранить, затем если `next/image` в BlockRenderer не обслуживает SVG без `dangerouslyAllowSVG`, **конвертировать в PNG через sharp** и в блоках ссылаться на PNG (per D-03 + check Next Image); `.emf` — попытаться ImageMagick `magick` если есть в PATH, иначе skip + console.warn, **не** коммитить сырые EMF (per D-03).
   - Отфильтровать декоративный chrome: файлы &lt; 2KB без смыслового контекста можно skip; образовательные схемы оставлять.
   - Распарсить `word/document.xml` + `word/_rels/document.xml.rels`: обход параграфов и drawing/blip в порядке документа → `ContentBlock[]`: `text` (кириллица/латиница), `arabic` если `hasArabic(text)` (реюз из program-import-utils), `image` с `url: /uploads/program/level1/step-{N}/{filename}`.
   - Per D-04: не включать в text строки, которые почти целиком из цифр/размеров (drawing extents), и очевидный Word field garbage.
   - Не извлекать title/hours из docx (per D-02).

3. Записать `prisma/data/level1-teacher-notes.json` вида:
   `[{ "order": 1, "teacherNote": { "blocks": [...] } }, ...]` на все 33 order.
   Лог summary: сколько шагов, сколько image-блоков, сколько EMF skipped.

4. В `package.json` добавить скрипт:
   `"db:import:level1-teacher": "tsx prisma/import-level1-teacher-book.ts"`
   (source path передавать аргументом после `--`).

Запустить импорт один раз против реального source path; убедиться что JSON и `public/uploads/program/level1/step-1/` появились.
  </action>
  <verify>
    <automated>pnpm exec tsx -e "const j=require('./prisma/data/level1-teacher-notes.json'); if(j.length!==33) throw new Error('expected 33'); if(!j[0].teacherNote?.blocks?.length) throw new Error('empty blocks'); console.log('ok', j.length, j[0].teacherNote.blocks.length)"</automated>
  </verify>
  <done>
33 записи в level1-teacher-notes.json с непустыми blocks; медиа PNG/JPEG/(конвертированные) в public/uploads/program/level1/step-*; EMF не лежат как бинарники в uploads без конвертации; non-step docx проигнорированы (D-01, D-03, D-04, D-05).
  </done>
</task>

<task type="auto">
  <name>Task 2: Seed upsert teacherNote из JSON</name>
  <files>prisma/lib/program-import-utils.ts, prisma/lib/seed-program.ts</files>
  <read_first>
    - prisma/lib/program-import-utils.ts
    - prisma/lib/seed-program.ts (createLevelWithSteps / upsertLevelWithSteps)
    - prisma/data/level1-teacher-notes.json (из Task 1)
  </read_first>
  <action>
Per D-01 / D-02:

1. Расширить `StepDef` в `program-import-utils.ts` опциональным полем `teacherNote?: { blocks: Array&lt;...&gt; }` (форма как stepContentSchema / пустой `{ blocks: [] }`).

2. После `loadAllLevel1Steps()` (или внутри него): загрузить `level1-teacher-notes.json`, смержить по `order` в StepDef. Если файла нет — teacherNote не задавать (seed не падает; уровни 2–5 без изменений). Не менять title/hours/lesson/letters/task/order из page JSON.

3. В `createLevelWithSteps` и `upsertLevelWithSteps` (`seed-program.ts`): при create/update писать
   `teacherNote: step.teacherNote ?? { blocks: [] }`
   наряду с `content: buildContent(step)`.
   Не трогать mini-program seed кроме дефолта пустого teacherNote если Prisma требует поле (у Step уже default в schema).

4. Не менять `level1-page*.json` содержимое metadata.

После правок прогнать `pnpm db:seed:program:force` (нужен DATABASE_URL). Smoke: через Prisma/tsx проверить, что у level 1 step order=1 `teacherNote.blocks.length &gt; 0` и `content` всё ещё содержит блоки из buildContent (например «Урок:»).
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit</automated>
  </verify>
  <done>
seedProgram upsert пишет teacherNote для уровня 1; content остаётся из buildContent; title/hours/order из page JSON (D-01, D-02); tsc чистый.
  </done>
</task>

<task type="auto">
  <name>Task 3: Проверка картинок в UI-пайплайне и git-артефакты</name>
  <files>src/features/program-admin/ui/BlockRenderer.tsx, public/uploads/program/level1/, prisma/data/level1-teacher-notes.json</files>
  <action>
Убедиться, что image-блоки из teacherNote реально рендерятся:

1. `BlockRenderer` уже использует `next/image` с `src={block.url}`. Локальные файлы из `public/` по пути `/uploads/...` должны работать без remotePatterns. Если SVG остались как `.svg` и next/image их отвергает — либо доконвертировать в PNG в импорте (предпочтительно, уже Task 1), либо точечно для локальных `/uploads/program/` поставить `unoptimized` только когда url оканчивается на `.svg` (минимальный diff). Не ломать S3 remote images.

2. Проверить один URL из JSON: файл существует на диске относительно `public/`.

3. Закоммитить образовательные PNG/JPEG (и SVG только если оставлены и нужны); не коммитить EMF; при огромном объёме медиа — всё равно включить в репозиторий per D-03 (это учебный контент сидера). Добавить `public/uploads/program/` в отслеживаемые файлы (сейчас uploads не в .gitignore).

Не добавлять E2E в этом quick-task (только data/seed).
  </action>
  <verify>
    <automated>pnpm exec tsx -e "const fs=require('fs'); const path=require('path'); const j=require('./prisma/data/level1-teacher-notes.json'); const imgs=j.flatMap(s=>s.teacherNote.blocks.filter(b=>b.type==='image')); if(!imgs.length) throw new Error('no images'); const miss=imgs.filter(b=>!fs.existsSync(path.join('public', b.url.replace(/^\\//,'')))); if(miss.length) throw new Error('missing '+miss[0].url); console.log('images ok', imgs.length)"</automated>
  </verify>
  <done>
Все image.url из level1-teacher-notes.json указывают на существующие файлы под public/; BlockRenderer способен показать их в teacherNote журнала; EMF отсутствует в uploads.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Local docx → filesystem/DB | Импорт с машины разработчика; путь source только CLI |
| Seed → PostgreSQL | Перезапись teacherNote/content уровня 1 через force seed |
| public/uploads → browser | Статические учебные изображения без auth |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mnz-01 | Tampering | import-level1-teacher-book.ts | medium | mitigate | Импорт только локальный one-shot; не expose HTTP; path из CLI |
| T-mnz-02 | Information Disclosure | teacherNote в API журнала | low | accept | teacherNote уже показывается учителю в StepCard; ученику не отдаётся этим изменением |
| T-mnz-03 | Denial of Service | huge media in public/ | low | mitigate | Skip EMF; filter tiny chrome; PNG/JPEG only for commit |
| T-mnz-SC | Tampering | jszip npm install | medium | mitigate | jszip — известный пакет; ставить только как devDependency; проверить npm page при install |
</threat_model>

<verification>
- `pnpm db:import:level1-teacher -- --source "<Cyrillic path>"` создаёт 33 teacher notes + медиа
- `pnpm db:seed:program:force` пишет teacherNote в БД
- Автопроверки Tasks 1–3 (JSON length, tsc, image files exist)
</verification>

<success_criteria>
- 33 шага уровня 1 имеют rich teacherNote из книги учителя
- Student content = buildContent(metadata); метаданные page JSON не сломаны
- Картинки доступны по /uploads/program/level1/step-N/...
- Non-step docx и несконвертированные EMF не попадают в артефакты
</success_criteria>

<output>
Create `.planning/quick/260716-mnz-1/260716-mnz-SUMMARY.md` when done
</output>
