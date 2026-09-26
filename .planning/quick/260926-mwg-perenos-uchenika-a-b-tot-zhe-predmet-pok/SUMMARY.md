---
quick_id: 260926-mwg
slug: perenos-uchenika-a-b-tot-zhe-predmet-pok
status: complete
---

# Summary

## Done

1. **Перенос A→B (тот же предмет)**
   - `transferStudent` + `listTransferTargetGroups`
   - UI «Перевести» на странице группы
   - Сохраняет `levelId` и `currentStepIdx`; чужой предмет / дубль в цели — ошибка

2. **Статус на учётке ученика**
   - Кабинет `/student/me`: Tag + Alert для паузы/архива
   - Шапка AppShell: Tag рядом с именем

3. Учётка родителя — не делали (по решению)

## Tests

- `vitest` group-actions: transfer + listTransferTargetGroups
- `tsc --noEmit`
