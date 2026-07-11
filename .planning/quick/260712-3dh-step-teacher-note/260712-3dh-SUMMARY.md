---
status: complete
---

# Quick Task 260712-3dh: Заметка учителя в шагах

## Summary

Добавлено поле `teacherNote` (JSON StepContent) в модель Step с миграцией БД. В админке программы — второй StepEditor «Заметка учителя». В журнале учитель видит rich-text заметку через StepContentPreview при раскрытии шага.

## Commits

- feat(steps): add teacherNote field with editor and journal display

## Files changed

- `prisma/schema.prisma`, `prisma/migrations/20260711232657_add_step_teacher_note/`
- `src/shared/lib/validations/step.ts`
- `src/features/program-admin/actions/program-actions.ts`
- `src/features/program-admin/ui/StepForm.tsx`
- `src/app/(dashboard)/admin/subjects/.../edit/page.tsx`
- `src/features/journal/actions/journal-actions.ts`
- `src/features/journal/lib/journal-step.ts`
- `src/features/journal/ui/StepCard.tsx`
