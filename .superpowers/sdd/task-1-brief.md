### Task 1: Prisma вЂ” РїРѕР»СЏ РЅР° Session

**Files:**
- Modify: `prisma/schema.prisma` (model `Session`)
- Create: `prisma/migrations/<timestamp>_session_absence_excused/migration.sql`
- Test: `pnpm exec prisma validate`

**Interfaces:**
- Produces: `Session.absenceExcused: boolean` (default `false`), `Session.absenceReason: string | null`

- [ ] **Step 1: Р”РѕР±Р°РІРёС‚СЊ РїРѕР»СЏ РІ schema**

Р’ `model Session` РїРѕСЃР»Рµ `note`:

```prisma
  note             String?
  absenceExcused   Boolean          @default(false)
  absenceReason    String?
  isAdjustment     Boolean          @default(false)
```

- [ ] **Step 2: РЎРѕР·РґР°С‚СЊ РјРёРіСЂР°С†РёСЋ**

Р›РѕРєР°Р»СЊРЅРѕ (docker postgres / Р±РµР·РѕРїР°СЃРЅС‹Р№ DATABASE_URL):

```bash
pnpm db:migrate -- --name session_absence_excused
```

Р•СЃР»Рё DATABASE_URL СѓРєР°Р·С‹РІР°РµС‚ РЅР° test/prod вЂ” С‚РѕР»СЊРєРѕ С„Р°Р№Р»:

```bash
pnpm db:migrate -- --create-only --name session_absence_excused
```

SQL РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ С‚РѕР»СЊРєРѕ:

```sql
ALTER TABLE "Session" ADD COLUMN "absenceExcused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "absenceReason" TEXT;
```

- [ ] **Step 3: Generate client**

```bash
pnpm exec prisma generate
```

Expected: СѓСЃРїРµС…, Р±РµР· РѕС€РёР±РѕРє.

- [ ] **Step 4: Validate**

```bash
pnpm exec prisma validate
```

Expected: schema is valid.

---
