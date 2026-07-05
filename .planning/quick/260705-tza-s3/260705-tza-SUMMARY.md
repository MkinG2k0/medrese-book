---
status: complete
---

# Quick Task 260705-tza — Summary

## Done

- S3-клиент на `@aws-sdk/client-s3` с конфигурацией через env
- `uploadFile()` — S3 при заполненных переменных, иначе локальный `public/uploads`
- `/api/uploads` переведён на общий модуль загрузки
- Env-шаблоны в `.env.example` и `.env.production.example`
- `next.config.ts` — `remotePatterns` из `S3_PUBLIC_URL` для `next/image`
- Unit-тесты для `s3-config`

## Commit

b5ddde1 — feat(storage): подключить S3 для загрузки файлов

## Env для заполнения

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-central-1
S3_BUCKET=
S3_PUBLIC_URL=
# S3_ENDPOINT=        # MinIO / R2
# S3_PREFIX=uploads   # по умолчанию
```
