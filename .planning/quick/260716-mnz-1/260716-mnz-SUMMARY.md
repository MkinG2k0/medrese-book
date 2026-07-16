---
phase: 260716-mnz-1
plan: 01
subsystem: program-seed
tags: [prisma, seed, teacherNote, docx, jszip, sharp, level1]

requires: []
provides:
  - level1-teacher-notes.json (33 steps)
  - public/uploads/program/level1/step-N media
  - seedProgram upsert writes teacherNote for level 1
affects: [journal teacherNote UI, program seed]

tech-stack:
  added: [jszip]
  patterns:
    - "docx → JSZip → ContentBlock[] teacherNote; metadata JSON → buildContent for student content"
    - "SVG→PNG via sharp; EMF skip without ImageMagick"

key-files:
  created:
    - prisma/import-level1-teacher-book.ts
    - prisma/data/level1-teacher-notes.json
    - public/uploads/program/level1/
  modified:
    - package.json
    - pnpm-lock.yaml
    - prisma/lib/program-import-utils.ts
    - prisma/lib/seed-program.ts

key-decisions:
  - "D-01: Full teacher book → teacherNote; buildContent(metadata) → content"
  - "Default source path as Unicode string literal in import script"
  - "SVG converted to PNG; 29 EMF skipped (no ImageMagick)"

patterns-established:
  - "loadAllLevel1Steps merges optional level1-teacher-notes.json by order"
  - "create/upsert Level steps write teacherNote ?? { blocks: [] }"

requirements-completed: [QUICK-MNZ-01]

coverage:
  - id: D1
    description: "33 level-1 teacher notes imported from teacher book docx with images"
    requirement: QUICK-MNZ-01
    verification:
      - kind: other
        ref: "pnpm db:import:level1-teacher + JSON length===33 check"
        status: pass
    human_judgment: false
  - id: D2
    description: "seedProgram force upserts teacherNote while content stays from buildContent"
    requirement: QUICK-MNZ-01
    verification:
      - kind: other
        ref: "pnpm db:seed:program:force + Prisma smoke (teacherBlocks>0, content has Урок:)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All teacherNote image URLs resolve under public/; no EMF committed"
    requirement: QUICK-MNZ-01
    verification:
      - kind: other
        ref: "tsx image existence check (104 images, 0 missing, 0 emf)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-16
status: complete
---

# Quick 260716-mnz-1: Level 1 teacher book → teacherNote Summary

**Импорт 33 docx книги учителя в `teacherNote` с 104 PNG/JPEG в `public/uploads/program/level1/`, seed upsert пишет методичку в БД, student `content` остаётся из `buildContent(metadata)`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-16T13:25:14Z
- **Completed:** 2026-07-16T13:37:00Z
- **Tasks:** 3/3
- **Files modified:** ~110 (включая медиа)

## Accomplishments

- One-shot `prisma/import-level1-teacher-book.ts` + `pnpm db:import:level1-teacher`
- `level1-teacher-notes.json`: 33 записи с непустыми blocks; non-step docx пропущены
- Seed merge по `order` + upsert `teacherNote`; force seed успешно на локальной БД
- 104 image URL валидны на диске; EMF не в репозитории; BlockRenderer без изменений (только PNG/JPEG)

## Task Commits

1. **Task 1: Import-скрипт книги учителя → JSON + медиа** — `6519936` (feat)
2. **Task 2: Seed upsert teacherNote из JSON** — `2f7ce8f` (feat)
3. **Task 3: Проверка картинок в UI-пайплайне** — без отдельного коммита (верификация; медиа уже в Task 1; BlockRenderer не менялся)

**Plan metadata:** не коммитился исполнителем (orchestrator / commit_docs)

## Files Created/Modified

- `prisma/import-level1-teacher-book.ts` — JSZip-парсер docx → JSON + media
- `prisma/data/level1-teacher-notes.json` — 33 teacherNote
- `public/uploads/program/level1/step-*/` — учебные изображения
- `prisma/lib/program-import-utils.ts` — `teacherNote` на StepDef + merge
- `prisma/lib/seed-program.ts` — create/upsert пишет teacherNote
- `package.json` / `pnpm-lock.yaml` — jszip + script `db:import:level1-teacher`

## Decisions Made

- Source path по умолчанию — Unicode-литерал в скрипте; `--source` override поддержан
- SVG → PNG через sharp (в JSON нет `.svg` URL)
- EMF без ImageMagick — skip + warn (29 файлов)

## Deviations from Plan

None - plan executed as written.

Minor note: Task 3 не потребовал diff в `BlockRenderer` — все image URL уже PNG/JPEG после конвертации SVG.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None beyond plan threat model (local one-shot import, public educational media).

## Verification Results

| Check | Result |
|-------|--------|
| JSON length 33, blocks non-empty | pass |
| `tsc --noEmit` | pass |
| `pnpm db:seed:program:force` | pass (levels 1–5 resynced) |
| DB smoke step order=1 teacherNote.blocks + content «Урок:» | pass (115 / 5 blocks) |
| Image files exist for all image blocks | pass (104) |
| EMF in uploads | 0 |

## Self-Check: PASSED

- `prisma/import-level1-teacher-book.ts` — FOUND
- `prisma/data/level1-teacher-notes.json` — FOUND
- `public/uploads/program/level1/step-1/` — FOUND
- Commit `6519936` — FOUND
- Commit `2f7ce8f` — FOUND
