# Quick Task 260625-ljc: PWA — SUMMARY

**Status:** complete (checkpoint: ручная проверка на устройстве)
**Commit:** 1a368a5

## Что сделано

### 1. Web App Manifest и иконки
- `public/manifest.webmanifest` — standalone PWA, start_url `/dashboard`, theme `#0D1117`
- Иконки 192×192, 512×512, apple-touch-icon 180×180 из `icon.png`
- `layout.tsx` — ссылка на manifest, appleWebApp metadata

### 2. Service Worker
- Добавлен минимальный `fetch` handler в `public/sw.js` (требование Chrome для installability)
- Push handlers без изменений

### 3. Install UX + Push CTA
- `src/features/pwa/` — `usePwaInstall`, `PwaInstallBanner`
- Android/Chrome: кнопка «Установить» через `beforeinstallprompt`
- iOS: инструкция «Поделиться → На экран Домой»
- После установки / в standalone: CTA «Включить уведомления»
- `usePushSubscribe` вынесен в общий хук; `PushSubscribePrompt` использует его

### 4. Middleware
- Исключены `manifest.webmanifest` и PWA-иконки из auth matcher

## Что уже было (не трогали)

- Web Push: VAPID, `/api/push/*`, `deliver-notifications.ts`
- Уведомления о сообщениях, отпусках и др. через domain events

## Проверка на устройстве

1. `pnpm dev` → Chrome DevTools → Application → Manifest
2. Android: баннер «Установить» → standalone
3. В PWA: «Включить уведомления» → permission + POST `/api/push/subscribe`
4. iOS Safari: инструкция в баннере → «На экран Домой»

## Env для push (production)

```
VAPID_SUBJECT=mailto:admin@toykhana.ru
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
# опционально:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```
