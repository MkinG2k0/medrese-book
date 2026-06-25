# Phase 9 — отложенные требования

## NOTF-03: Уведомления об успеваемости

**Статус:** отложено за пределы Phase 9  
**Дата решения:** 2026-06-25

### Что требует NOTF-03

- Алерты при низкой оценке на шаге программы
- Алерты при превышении норматива 48 часов на шаг (по `Step.hours` или фактическому времени — уточнить в Phase 1/ANLY)
- Доставка менеджеру и/или учителю через тот же канал in-app + Web Push

### Почему отложено в v1

1. **Нет domain events** для успеваемости — в Phase 9 подключены только события отпусков и замещений (`LEAVE_REQUEST_*`, `SUBSTITUTION_ACTIVATED`).
2. **Нет фонового планировщика** — норматив 48ч требует периодической проверки прогресса, а не post-commit hook.
3. **Зависимость от аналитики** — расчёт отставания уже частично в Phase 1; алерты логичнее вешать после стабилизации метрик.

### Предлагаемый хук для будущей фазы

- **ANLY-07** (или отдельная фаза «grade alerts»): cron/queue job → `dispatchDomainEvent('PERFORMANCE_ALERT', …)` → существующий `enqueueNotifications` + `deliverNotifications`.
- Добавить enum `PERFORMANCE_ALERT` / `NORMATIVE_EXCEEDED` в `NotificationType` при реализации, не в Phase 9.

### Что уже готово для NOTF-03

- Инфраструктура `Notification`, bell, SSE, Web Push (NOTF-01, 02, 05, 06)
- Паттерн `buildNotificationsForEvent` + unit-тесты копирайта
