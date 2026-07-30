### Task 5: API sessions + РєР»РёРµРЅС‚СЃРєРёРµ С‚РёРїС‹

**Files:**
- Modify: `src/app/api/sessions/route.ts`
- Modify: `src/features/journal/lib/get-student-session.ts`
- Modify: `src/entities/session/api/use-sessions.ts`

**Interfaces:**
- Consumes: `CreateSessionInput.absenceExcused`, `absenceReason`
- Produces: `StudentSession` / `ClientDaySession` СЃ С‚РµРјРё Р¶Рµ РїРѕР»СЏРјРё

- [ ] **Step 1: Persist РІ POST**

Р’ `route.ts`:

```ts
const {
  studentId,
  groupId,
  date,
  attendance,
  lateMinutes,
  note,
  absenceExcused,
  absenceReason,
  completions,
} = parsed.data

const sessionData = {
  attendance,
  lateMinutes: attendance === 'LATE' ? lateMinutes : null,
  note,
  absenceExcused: attendance === 'ABSENT' ? absenceExcused : false,
  absenceReason: attendance === 'ABSENT' ? absenceReason : null,
}
```

(РЎС…РµРјР° СѓР¶Рµ РЅРѕСЂРјР°Р»РёР·СѓРµС‚ вЂ” РґСѓР±Р»РёСЂРѕРІР°РЅРёРµ РЅР° API РѕРє РґР»СЏ СЏСЃРЅРѕСЃС‚Рё.)

- [ ] **Step 2: get-student-session**

Р Р°СЃС€РёСЂРёС‚СЊ `DaySessionRecord` Рё `select` / `serializeDaySession`:

```ts
absenceExcused: boolean
absenceReason: string | null
```

- [ ] **Step 3: use-sessions С‚РёРїС‹**

```ts
type CreateSessionPayload = {
  // ...
  absenceExcused?: boolean
  absenceReason?: string | null
  completions: ...
}

export type StudentSession = {
  // ...
  absenceExcused: boolean
  absenceReason: string | null
  completions: ...
}
```

- [ ] **Step 4: Smoke typecheck (optional)**

```bash
pnpm exec tsc --noEmit
```

РР»Рё РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ lint Р·Р°С‚СЂРѕРЅСѓС‚С‹С… С„Р°Р№Р»РѕРІ РїРѕСЃР»Рµ Task 6.

---
