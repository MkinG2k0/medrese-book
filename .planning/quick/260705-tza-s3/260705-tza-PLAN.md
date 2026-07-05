# Quick Task 260705-tza: подключи s3 в проект, и создай энвы я потом их заполню

## Tasks

### 1. S3-клиент и загрузка
- `src/shared/lib/storage/s3-config.ts` — чтение env, `isS3Configured()`, сборка публичного URL
- `src/shared/lib/storage/upload-file.ts` — S3 при настроенных env, иначе локальный fallback в `public/uploads`
- Unit-тест для `s3-config`

### 2. API и конфигурация
- `src/app/api/uploads/route.ts` — использовать `uploadFile`
- `.env.example`, `.env.production.example` — переменные S3 с комментариями
- `next.config.ts` — `remotePatterns` из `S3_PUBLIC_URL` для `next/image`
