---
status: complete
---

# Quick Task 260701-x5w: Fix substitution label display logic — Summary

## Изменения

- `isTeacherActivelySubstituting()` — проверяет активное замещение substitute → absent teacher
- `getSubstitutionTargetUserIds()` — список userId замещаемых учителей с активным замещением
- Хедер: метка «Учитель — Замещение» только при `showSubstitutionRoleLabel`
- UserSwitcher: метка только для учителей из `substitutionTargetUserIds`, а не для всех кроме владельца сессии

## Причина бага

`isSubstituting = !!switchOwnerId` срабатывал при устаревшей сессии переключения или переключении менеджера, даже когда замещение в БД уже неактивно.
