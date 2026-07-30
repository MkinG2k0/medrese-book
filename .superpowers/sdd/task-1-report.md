# Task 1 Report: Storage-хелпер черновика

**Branch:** `feat/extra-assignment-create-draft`  
**Date:** 2026-07-30  
**Status:** DONE

## Scope

Добавлены localStorage-хелперы для черновика формы создания допзадания. UI не затронут (Task 2).

### Files created

| File | Purpose |
|------|---------|
| `src/features/extra-assignments/lib/extra-assignment-draft.ts` | Тип, ключ, read/write/clear |
| `src/features/extra-assignments/lib/extra-assignment-draft.test.ts` | Vitest unit-тесты (8 кейсов) |

## TDD Evidence

### RED — Step 2 (failing test before implementation)

**Command:**
```bash
pnpm exec vitest run src/features/extra-assignments/lib/extra-assignment-draft.test.ts
```

**Output:**
```
 RUN  v4.1.9 D:/Project/Main/medrese-book

 ❯ src/features/extra-assignments/lib/extra-assignment-draft.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/features/extra-assignments/lib/extra-assignment-draft.test.ts
Error: Cannot find package '@/features/extra-assignments/lib/extra-assignment-draft' imported from ...

 Test Files  1 failed (1)
      Tests  no tests
```

**Result:** FAIL — module not found (expected).

### GREEN — Step 4 (after implementation)

**Command:**
```bash
pnpm exec vitest run src/features/extra-assignments/lib/extra-assignment-draft.test.ts
```

**Output:**
```
 RUN  v4.1.9 D:/Project/Main/medrese-book

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  233ms
```

**Result:** PASS — all 8 tests green.

## Implementation Summary

### Exports

- `ExtraAssignmentCreateDraft` — `{ title, levelId?, stepId, content: StepContent }`
- `draftStorageKey(userId, subjectId)` → `extra-assignment-draft:{userId}:{subjectId}`
- `readExtraAssignmentDraft(userId, subjectId)` — parse + validate via `stepContentSchema`, null on error/SSR
- `writeExtraAssignmentDraft(userId, subjectId, draft)` — JSON.stringify to localStorage
- `clearExtraAssignmentDraft(userId, subjectId)` — removeItem

### Validation (`isDraft`)

- `title` — string (required)
- `levelId` — optional string
- `stepId` — `string | null`
- `content` — validated through `stepContentSchema.safeParse`

### Pattern alignment

Следует `src/features/journal/lib/journal-storage.ts`:

- SSR guard: `typeof window === 'undefined'`
- Empty id guard: `!userId || !subjectId`
- try/catch around localStorage with silent fallback
- Vitest mock: `createLocalStorageMock()` + `vi.stubGlobal('localStorage', …)` + `vi.stubGlobal('window', {})`

## Test Coverage (8 cases)

1. Storage key format
2. Round-trip read/write
3. Missing key → null
4. Subject isolation (u1:s1 vs u1:s2)
5. clear removes draft
6. Invalid JSON → null
7. Invalid shape (title: number, content: null) → null
8. SSR (no window) → null

## Self-Review

| Check | Verdict |
|-------|---------|
| Matches brief API exactly | ✅ |
| Uses `StepContent` / `stepContentSchema` from shared validations | ✅ |
| No UI files modified | ✅ |
| No commit (per global constraints) | ✅ — files unstaged |
| ESLint on new files | ✅ — no linter errors |
| Follows journal-storage conventions | ✅ |

## Concerns

None.

## Commits

None — per instructions (user did not request commit).
