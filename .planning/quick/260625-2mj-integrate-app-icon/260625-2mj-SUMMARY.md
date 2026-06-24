# Quick Task 260625-2mj: Интеграция иконки — Summary

**Commit:** e79075f

## Что сделано

1. **Favicon** — в `layout.tsx` добавлены `icons.icon` и `icons.apple` → `/icon.png`
2. **AppLogo** — переиспользуемый компонент `src/shared/ui/AppLogo.tsx` (next/image, круглая маска)
3. **AppShell** — логотип в шапке сайдбара; при свёрнутом меню — только иконка
4. **LoginForm** — логотип 72px над заголовком «Вход в дневник»

## Файлы

- `src/shared/ui/AppLogo.tsx` (новый)
- `src/app/layout.tsx`
- `src/widgets/app-shell/ui/AppShell.tsx`
- `src/features/auth/ui/LoginForm.tsx`
