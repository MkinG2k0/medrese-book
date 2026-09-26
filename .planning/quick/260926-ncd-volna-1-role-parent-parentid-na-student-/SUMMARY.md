---
title: "Волна 1: Role.PARENT + parentId"
quick_id: 260926-ncd
status: complete
date: 2026-09-26
---

# Summary

Добавлена роль `PARENT`, связь `Student.parentId`, создание/редактирование опекуна в админке и портал `/parent/me` со списком детей.

## Changes

- Prisma: enum `PARENT`, `Student.parentId` → `User`, миграция `20260926150000_add_parent_role`
- `createUsers` / `searchParents` / форма создания: выбрать опекуна / ввести / авто `Опекун {ФИО}`
- `UserDetailModal`: селект опекуна, lock имени/телефона при выборе
- Auth: `/parent/*`, редирект `/parent/me`, меню AppShell, новости для PARENT
- Портал: `parent-portal` + страница «Мои дети»

## Out of scope (waves 2–5)

- Прогресс детей, заявки на оплату, draft, cron-напоминание
