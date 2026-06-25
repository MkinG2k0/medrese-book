---
phase: 260625-ljc-pwa
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/manifest.webmanifest
  - public/icon-192.png
  - public/icon-512.png
  - public/apple-touch-icon.png
  - public/sw.js
  - src/app/layout.tsx
  - src/features/pwa/index.ts
  - src/features/pwa/model/use-pwa-install.ts
  - src/features/pwa/ui/PwaInstallBanner.tsx
  - src/features/notifications/model/use-push-subscribe.ts
  - src/features/notifications/ui/PushSubscribePrompt.tsx
  - src/widgets/app-shell/ui/AppShell.tsx
autonomous: false
requirements:
  - PWA-INSTALL
  - PWA-PUSH
user_setup: []

must_haves:
  truths:
    - "Chrome/Android предлагает установку PWA (иконка «Установить» или баннер)"
    - "iOS Safari показывает инструкцию «На экран Домой»"
    - "Установленное PWA открывается в standalone без адресной строки"
    - "Push-подписка работает из установленного PWA так же, как из браузера"
  artifacts:
    - path: public/manifest.webmanifest
      provides: "Web App Manifest с name, icons 192/512, display standalone, start_url"
    - path: public/sw.js
      provides: "Service worker с fetch handler для installability + существующие push handlers"
    - path: src/features/pwa/ui/PwaInstallBanner.tsx
      provides: "UI установки и post-install CTA для push"
  key_links:
    - from: src/app/layout.tsx
      to: public/manifest.webmanifest
      via: "metadata.manifest"
      pattern: "manifest.*manifest\\.webmanifest"
    - from: src/features/pwa/ui/PwaInstallBanner.tsx
      to: public/manifest.webmanifest
      via: "beforeinstallprompt → deferredPrompt.prompt()"
      pattern: "beforeinstallprompt|deferredPrompt"
    - from: src/features/pwa/ui/PwaInstallBanner.tsx
      to: src/features/notifications/model/use-push-subscribe.ts
      via: "post-install push CTA"
      pattern: "usePushSubscribe|subscribe"
---

# Quick Task 260625-ljc: PWA — установка на телефон + push

<objective>
Добавить installable PWA поверх уже реализованного Web Push (sw.js, VAPID, PushSubscribePrompt). Пользователь может установить «Дневник медресе» на телефон и получать push о сообщениях, отпусках и др.

Purpose: мобильный доступ без закладки в браузере; push уже работает — нужен только manifest + install UX.
Output: manifest, иконки, metadata, install banner, post-install push CTA.
</objective>

<context>
@src/app/layout.tsx
@public/sw.js
@public/icon.png
@src/shared/lib/site.ts
@src/features/notifications/ui/PushSubscribePrompt.tsx
@src/widgets/app-shell/ui/AppShell.tsx

<interfaces>
From `src/shared/lib/site.ts`:
```typescript
export const SITE_NAME = 'Дневник медресе' as const
```

From `public/sw.js` (НЕ переписывать push/notificationclick — только дополнить):
```javascript
self.addEventListener('push', ...)
self.addEventListener('notificationclick', ...)
```

From `PushSubscribePrompt.tsx` — логика subscribe (вынести в хук, не дублировать):
- `resolveVapidPublicKey()` → fetch `/api/push/vapid-public`
- `navigator.serviceWorker.register('/sw.js')`
- `registration.pushManager.subscribe(...)` → POST `/api/push/subscribe`
- localStorage keys: `push-prompt-dismissed`, `push-prompt-denied`

middleware уже исключает `sw.js` из auth.
</interfaces>

**НЕ трогать:** `send-push.ts`, `deliver-notifications.ts`, API `/api/push/*`, VAPID config.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Manifest, иконки и metadata</name>
  <files>public/manifest.webmanifest, public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png, src/app/layout.tsx</files>
  <action>
1. Сгенерировать PNG из `public/icon.png` (sharp уже в зависимостях Next): `icon-192.png` (192×192), `icon-512.png` (512×512), `apple-touch-icon.png` (180×180). Одноразовый скрипт `scripts/generate-pwa-icons.mjs` или inline `node -e` — результат коммитить в `public/`.

2. Создать `public/manifest.webmanifest`:
   - `name` / `short_name`: «Дневник медресе» (из `SITE_NAME`)
   - `start_url`: `/dashboard`
   - `scope`: `/`
   - `display`: `standalone`
   - `background_color` / `theme_color`: `#0D1117` (как в viewport)
   - `lang`: `ru`
   - `icons`: 192 и 512 с `purpose: "any maskable"` (maskable можно тот же файл)
   - НЕ добавлять `gcm_sender_id` и прочие push-поля — push через существующий SW

3. Обновить `src/app/layout.tsx` metadata:
   - `manifest: '/manifest.webmanifest'`
   - `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE_NAME }`
   - `icons.apple`: `/apple-touch-icon.png`
   - Сохранить существующий `icon: '/icon.png'`

Импортировать `SITE_NAME` из `@/shared/lib/site`.
  </action>
  <verify>
    <automated>pnpm build</automated>
  </verify>
  <done>manifest доступен по `/manifest.webmanifest`, layout содержит ссылку, иконки 192/512/apple-touch существуют</done>
</task>

<task type="auto">
  <name>Task 2: SW fetch handler для installability</name>
  <files>public/sw.js</files>
  <action>
Добавить в `public/sw.js` **перед** существующими listeners минимальный fetch handler — Chrome требует его для PWA install criteria:

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
```

НЕ добавлять offline cache, precache, workbox — только network pass-through. Сохранить push и notificationclick handlers без изменений логики.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const s=fs.readFileSync('public/sw.js','utf8'); if(!/addEventListener\('fetch'/.test(s)) process.exit(1)"</automated>
  </verify>
  <done>sw.js содержит fetch handler; push handlers на месте</done>
</task>

<task type="auto">
  <name>Task 3: Install banner + push после установки</name>
  <files>src/features/pwa/index.ts, src/features/pwa/model/use-pwa-install.ts, src/features/pwa/ui/PwaInstallBanner.tsx, src/features/notifications/model/use-push-subscribe.ts, src/features/notifications/ui/PushSubscribePrompt.tsx, src/widgets/app-shell/ui/AppShell.tsx</files>
  <action>
1. **Вынести subscribe-логику** из `PushSubscribePrompt.tsx` в `src/features/notifications/model/use-push-subscribe.ts`:
   - export `usePushSubscribe()` → `{ subscribe, loading, error }`
   - `PushSubscribePrompt` использует хук — поведение без изменений

2. **Хук `usePwaInstall`** (`src/features/pwa/model/use-pwa-install.ts`):
   - Слушать `beforeinstallprompt` → сохранить `deferredPrompt`, `canInstall: true`
   - Слушать `appinstalled` → `isInstalled: true`, очистить deferred
   - `isStandalone`: `window.matchMedia('(display-mode: standalone)').matches` или `navigator.standalone` (iOS)
   - `isIos`: `/iPad|iPhone|iPod/.test(navigator.userAgent)` && !standalone
   - localStorage `pwa-install-dismissed` для скрытия баннера
   - `promptInstall()`: `deferredPrompt.prompt()`, await `userChoice`

3. **`PwaInstallBanner`** (client component, русский UI, Ant Design Button, Tailwind layout — без Flex):
   - Показывать если НЕ standalone И НЕ dismissed:
     - **Android/Chrome** (`canInstall`): «Установите приложение на телефон» + кнопки «Установить» / «Не сейчас»
     - **iOS** (`isIos`): текст-инструкция «Поделиться → На экран Домой» (beforeinstallprompt на iOS нет)
   - После `appinstalled` ИЛИ в standalone при `Notification.permission === 'default'`: блок «Включите уведомления» с кнопкой, вызывающей `usePushSubscribe().subscribe()` — тот же flow что в колокольчике
   - Не показывать если `Notification.permission === 'granted'` или `denied`

4. **Подключить** `<PwaInstallBanner />` в `AppShell.tsx` — компактная полоска под header, над main content (не перекрывать sidebar).

5. Barrel `src/features/pwa/index.ts` — export `PwaInstallBanner`.

FSD: фича `pwa` не импортирует из `widgets`; `AppShell` импортирует из `@/features/pwa`.
  </action>
  <verify>
    <automated>pnpm lint</automated>
  </verify>
  <done>Баннер установки виден в браузере; после установки доступна кнопка push; PushSubscribePrompt в колокольчике работает как раньше</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Проверка установки PWA на телефоне</name>
  <files></files>
  <action>Ручная проверка install flow на Chrome/Android и инструкции iOS</action>
  <what-built>PWA manifest + install banner + push CTA после установки</what-built>
  <how-to-verify>
1. `pnpm dev`, открыть в Chrome DevTools → Application → Manifest: все поля заполнены, иконки загружаются
2. Lighthouse PWA или Chrome install icon в omnibox появляется
3. Android/Chrome: нажать «Установить» в баннере → приложение в standalone
4. В установленном PWA: нажать «Включить уведомления» → permission granted → POST `/api/push/subscribe` 200
5. iOS Safari: баннер показывает инструкцию «На экран Домой»; после добавления — push prompt доступен
  </how-to-verify>
  <verify>
    <automated>MISSING — checkpoint: human verifies install on device</automated>
  </verify>
  <done>Пользователь подтвердил установку и push в standalone PWA</done>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→manifest | Публичный статический файл, без секретов |
| client→SW registration | sw.js публичный; scope `/` |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-pwa-01 | I | manifest.webmanifest | accept | Публичные метаданные приложения |
| T-pwa-02 | S | beforeinstallprompt | accept | Браузер контролирует eligibility |
| T-pwa-03 | T | sw.js fetch handler | mitigate | Только network pass-through, без cache poisoning |
</threat_model>

<verification>
- `pnpm build` и `pnpm lint` проходят
- `/manifest.webmanifest` отдаёт валидный JSON
- Установка PWA не ломает существующий push flow в NotificationBell
</verification>

<success_criteria>
- PWA installable в Chrome (manifest + SW + icons)
- iOS получает apple-touch-icon и инструкцию установки
- Push subscribe работает из standalone PWA
- UI текст на русском
</success_criteria>

<output>
После выполнения создать `.planning/quick/260625-ljc-pwa/260625-ljc-SUMMARY.md`
</output>
