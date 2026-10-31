# Phase 13: Journal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 13-Journal
**Areas discussed:** Селектор группы, Отображение предмета, Страницы истории

---

## Селектор группы

| Option | Description | Selected |
|--------|-------------|----------|
| В шапке журнала рядом с датой | Тот же ритм, что у date picker | ✓ |
| Над заголовком | Отдельная строка контекста | |
| Под заголовком | Перед таймером урока | |
| На усмотрение Claude | | |

**User's choice:** В шапке журнала — рядом с выбором даты

---

| Option | Description | Selected |
|--------|-------------|----------|
| Только свои группы | group.teacherId = текущий учитель | ✓ |
| Свои + замещение | canAccessGroupAsTeacher | |
| Для менеджера — все | | |
| На усмотрение Claude | | |

**User's choice:** Только свои группы

---

| Option | Description | Selected |
|--------|-------------|----------|
| Первая по алфавиту | | |
| Последняя выбранная (localStorage) | | ✓ |
| Как сейчас findFirst | | |
| На усмотрение Claude | | |

**User's choice:** Последняя выбранная (localStorage)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ant Design Select | Как фильтр на /groups | ✓ |
| Segmented / Radio | Для 2–3 групп | |
| На усмотрение Claude | | |

**User's choice:** Ant Design Select

---

## Отображение предмета

| Option | Description | Selected |
|--------|-------------|----------|
| Бейдж рядом с Select | | |
| В заголовке страницы | | |
| Только в опциях Select | «Группа — Предмет» | ✓ |
| На усмотрение Claude | | |

**User's choice:** Только внутри опций Select

---

| Option | Description | Selected |
|--------|-------------|----------|
| Подпись в шапке урока | LessonPageHeader | ✓ |
| Только в ссылке «Назад» | | |
| Только на списке учеников | | |
| На усмотрение Claude | | |

**User's choice:** Подпись в шапке урока (Группа · Предмет)

---

| Option | Description | Selected |
|--------|-------------|----------|
| «Группа — Предмет» | | ✓ |
| «Предмет — Группа» | | |
| «Группа (Предмет)» | | |
| На усмотрение Claude | | |

**User's choice:** «Название группы — Предмет»

---

| Option | Description | Selected |
|--------|-------------|----------|
| Достаточно названия группы | | ✓ |
| Добавить уровень/кол-во учеников | | |
| На усмотрение Claude | | |

**User's choice:** Названия группы достаточно для различия

---

## Страницы истории

| Option | Description | Selected |
|--------|-------------|----------|
| Общий контекст (URL/localStorage) | Без отдельного picker | |
| Свой Select на /journal/history | | ✓ |
| На усмотрение Claude | | |

**User's choice:** Свой Select группы на странице истории

---

| Option | Description | Selected |
|--------|-------------|----------|
| groupId в URL | /journal/[studentId]/history?groupId=... | ✓ |
| Наследовать с урока | Ссылка передаёт groupId | |
| Автоопределение | Если одна группа | |
| На усмотрение Claude | | |

**User's choice:** groupId обязателен в URL

---

| Option | Description | Selected |
|--------|-------------|----------|
| Разные ключи localStorage | Журнал и история независимо | ✓ |
| Общий ключ | | |
| История без localStorage | | |
| На усмотрение Claude | | |

**User's choice:** Отдельные ключи localStorage

---

| Option | Description | Selected |
|--------|-------------|----------|
| Сохранять groupId + date | В ссылках назад и истории шагов | ✓ |
| Только groupId | Дата сбрасывается | |
| На усмотрение Claude | | |

**User's choice:** Сохранять groupId и date при навигации

---

## Claude's Discretion

- Имена ключей localStorage, синхронизация URL ↔ storage
- Пустые состояния, смена группы при активном таймере
- Доступ менеджера к журналу
- E2E-обновления

## Deferred Ideas

- Группы замещаемых учителей в селекторе — отклонено пользователем
- Отдельный subject-picker — вне скоупа
- URL-контекст и edge cases таймера — не обсуждались, на усмотрение planner
