---
quick_id: 260923-vb9
slug: vosstanovit-dop-zadaniya-v-zhurnale-doba
status: complete
---

# Summary

Восстановлены доп. задания в журнале. Уточнение: удалять назначенное, а не вырезать фичу.

## Done

- Вернул «Дать доп. задание» + карточки в журнале
- Добавил `DELETE /api/extra-assignments/instances/[id]` и кнопку удаления на карточке
- Оценку не вернул (Radio/колонки/API grade по-прежнему отключены)
- `ensureSession` создаёт сессию с `completions: []` — без преждевременного +1 шага
