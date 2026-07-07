# Phase 10 Discussion Log

**Date:** 2026-07-07
**Phase:** 10 — Subject Foundation

## Areas Discussed

### 1. Поля предмета
- **Q:** Какие поля хранить?
- **Options:** только название / название+описание / +порядок сортировки
- **Selected:** название (обяз.) + описание (опц.)

### 2. Удаление предмета
- **Q:** Поведение при удалении?
- **Options:** запрет при уровнях / каскад / soft delete
- **Selected:** запретить удаление, если есть уровни/шаги

### 3. Seed
- **Q:** Сколько демо-предметов?
- **Selected:** 3+ с разным объёмом программы
- **Q:** Какие предметы?
- **Selected:** Коран (полная), Таджвид, Арабский язык

### 4. Маршруты (доп. вопрос)
- **Q:** Что с `/admin/program`?
- **Selected:** убрать полностью, только `/admin/subjects`

## Skipped Areas (Claude discretion)
- **Маршруты админки** — `/admin/subjects` + `/admin/subjects/[id]/program`
- **Структура кода** — `subject-admin` + рефакторинг `program-admin`

## Carried Forward from Milestone v2.0
- Программа — шаблон на предмет
- Уровни → шаги как сейчас
- CRUD: MANAGER / SUPER_ADMIN
- Fresh start без миграции старых данных

## Deferred
- Сортировка предметов, soft delete, deprecated routes
