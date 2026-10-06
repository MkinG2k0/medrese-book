# Deferred items — 261006-cl7

Pre-existing, out of scope for this quick task:

- `pnpm exec tsc --noEmit -p tsconfig.json` fails in `src/shared/lib/notifications/build-notification.ts` (`TUITION_PAYMENT_REQUEST_CREATED` not in `NotificationType`). Unrelated to posts/teacher create.
- `pnpm exec playwright test e2e/posts.spec.ts --project=chromium` fails loading `playwright.config.ts` (`context.conditions?.includes is not a function`) in this agent shell — same environment issue as 261006-ck6. Spec rewritten as planned.
