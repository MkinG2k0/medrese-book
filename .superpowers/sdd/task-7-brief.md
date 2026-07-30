### Task 7: РђРЅР°Р»РёС‚РёРєР° вЂ” Р±РµР№РґР¶Рё РІ РєРѕР»РѕРЅРєРµ В«РџСЂРѕРїСѓСЃРєРёВ»

**Files:**
- Modify: `src/features/analytics/ui/AtRiskStudentsTable.tsx`

**Interfaces:**
- Consumes: `AtRiskStudentRow.absencesInMonth`, `.excusedAbsencesInMonth`

- [ ] **Step 1: Р РµРЅРґРµСЂ РєРѕР»РѕРЅРєРё**

```tsx
import { Tag } from 'antd'

{
  title: 'РџСЂРѕРїСѓСЃРєРё',
  key: 'absences',
  render: (_: unknown, record: AtRiskStudentRow) => {
    const unexcused = record.absencesInMonth
    const excused = record.excusedAbsencesInMonth
    if (unexcused === 0 && excused === 0) return '0'
    return (
      <div className="flex flex-wrap gap-1">
        {unexcused > 0 && <Tag color="red">{unexcused}</Tag>}
        {excused > 0 && <Tag color="gold">{excused}</Tag>}
      </div>
    )
  },
}
```

(`gold` в‰€ Р¶С‘Р»С‚С‹Р№ РІ antd; РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё `orange`.)

- [ ] **Step 2: РџСЂРѕРІРµСЂРёС‚СЊ С‚РёРїС‹ TypeScript** вЂ” С‚Р°Р±Р»РёС†Р° РєРѕРјРїРёР»РёСЂСѓРµС‚СЃСЏ СЃ РЅРѕРІС‹Рј РїРѕР»РµРј.

---
