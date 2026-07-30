### Task 6: UI Р¶СѓСЂРЅР°Р»Р° вЂ” AttendanceButtons + save

**Files:**
- Modify: `src/features/journal/ui/AttendanceButtons.tsx`
- Modify: `src/features/journal/model/use-lesson-page.ts`
- Modify: `src/features/journal/ui/lesson/LessonStepsSection.tsx`
- Modify: `src/features/journal/ui/LessonPage.tsx` (РµСЃР»Рё РїСЂРѕРєРёРґС‹РІР°РµС‚ attendance props)

**Interfaces:**
- Consumes: Task 5 payload fields
- Produces: UI РїСЂРё ABSENT: Switch В«РЈРІР°Р¶РёС‚РµР»СЊРЅР°СЏ РїСЂРёС‡РёРЅР°В» + Input В«РџСЂРёС‡РёРЅР°В»

- [ ] **Step 1: Р Р°СЃС€РёСЂРёС‚СЊ AttendanceButtons**

Props:

```ts
type AttendanceButtonsProps = {
  value: Attendance
  lateMinutes: number
  absenceExcused: boolean
  absenceReason: string
  onChange: (
    attendance: Attendance,
    lateMinutes?: number,
    absence?: { excused: boolean; reason: string },
  ) => void
  // ...existing
}
```

РџСЂРё РІС‹Р±РѕСЂРµ РЅРµ-ABSENT РІС‹Р·С‹РІР°С‚СЊ `onChange` Р±РµР· excused (СЂРѕРґРёС‚РµР»СЊ СЃР±СЂРѕСЃРёС‚ state).

РџСЂРё ABSENT РїРѕРґ lateMinutes-Р±Р»РѕРєРѕРј (Р·Р°РјРµРЅРёС‚СЊ `Flex` РЅР° `div` СЃ Tailwind):

```tsx
{value === 'ABSENT' && (
  <div className="flex flex-col gap-2">
    <Checkbox
      checked={absenceExcused}
      disabled={disabled}
      onChange={(e) =>
        onChange('ABSENT', undefined, {
          excused: e.target.checked,
          reason: absenceReason,
        })
      }
    >
      РЈРІР°Р¶РёС‚РµР»СЊРЅР°СЏ РїСЂРёС‡РёРЅР°
    </Checkbox>
    <Input.TextArea
      value={absenceReason}
      disabled={disabled}
      placeholder="РџСЂРёС‡РёРЅР° РїСЂРѕРїСѓСЃРєР° (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)"
      rows={2}
      onChange={(e) =>
        onChange('ABSENT', undefined, {
          excused: absenceExcused,
          reason: e.target.value,
        })
      }
    />
  </div>
)}
```

РРјРїРѕСЂС‚С‹: `Checkbox`, `Input` РёР· antd; СѓР±СЂР°С‚СЊ `Flex`.

- [ ] **Step 2: use-lesson-page state**

```ts
const [absenceExcused, setAbsenceExcused] = useState(false)
const [absenceReason, setAbsenceReason] = useState('')
```

РџСЂРё Р·Р°РіСЂСѓР·РєРµ `existingSession`:

```ts
setAbsenceExcused(existingSession.absenceExcused ?? false)
setAbsenceReason(existingSession.absenceReason ?? '')
```

РРЅР°С‡Рµ СЃР±СЂРѕСЃ РІ `false` / `''`.

Handler:

```ts
const handleAttendanceChange = (
  value: Attendance,
  minutes?: number,
  absence?: { excused: boolean; reason: string },
) => {
  setAttendance(value)
  if (minutes !== undefined) setLateMinutes(minutes)
  if (value !== 'ABSENT') {
    setAbsenceExcused(false)
    setAbsenceReason('')
    return
  }
  if (absence) {
    setAbsenceExcused(absence.excused)
    setAbsenceReason(absence.reason)
  }
}
```

Р’ `ensureSession` Рё `saveSession` payload:

```ts
absenceExcused: attendance === 'ABSENT' ? absenceExcused : false,
absenceReason:
  attendance === 'ABSENT' ? absenceReason.trim() || null : null,
```

РџСЂРѕРєРёРЅСѓС‚СЊ props РІ return РѕР±СЉРµРєС‚Р° С…СѓРєР° / LessonStepsSection.

- [ ] **Step 3: LessonStepsSection + LessonPage**

Р”РѕР±Р°РІРёС‚СЊ props `absenceExcused`, `absenceReason` Рё РїРµСЂРµРґР°С‚СЊ РІ `AttendanceButtons`. РћР±РЅРѕРІРёС‚СЊ `onAttendanceChange` СЃРёРіРЅР°С‚СѓСЂСѓ.

- [ ] **Step 4: Manual sanity** вЂ” `pnpm lint` РЅР° РёР·РјРµРЅС‘РЅРЅС‹С… С„Р°Р№Р»Р°С… РёР»Рё РѕС‚РєСЂС‹С‚СЊ СѓСЂРѕРє РІ UI.

---
