import { Button } from "antd";

type LessonSaveBarProps = {
  nextStudent: { id: string; name: string } | null;
  isSaving: boolean;
  onSave: () => void;
  onSaveAndNext: () => void;
};

export function LessonSaveBar({
  nextStudent,
  isSaving,
  onSave,
  onSaveAndNext,
}: LessonSaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card p-4 md:left-[240px]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
        {nextStudent && (
          <Button
            type="primary"
            size="large"
            block
            onClick={onSaveAndNext}
            loading={isSaving}
          >
            <span className="sm:hidden">Сохранить и далее</span>
            <span className="hidden truncate sm:inline">
              Сохранить и перейти к {nextStudent.name}
            </span>
          </Button>
        )}
        <Button
          type={nextStudent ? "default" : "primary"}
          size="large"
          block
          onClick={onSave}
          loading={isSaving}
        >
          Сохранить урок
        </Button>
      </div>
    </div>
  );
}
