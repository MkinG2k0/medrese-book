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
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#2a2622] bg-[#141210] p-4 md:left-[240px]">
      <div className="mx-auto flex w-full max-w-2xl gap-2">
        {nextStudent && (
          <Button
            type="primary"
            size="large"
            block
            onClick={onSaveAndNext}
            loading={isSaving}
          >
            Сохранить и перейти к {nextStudent.name}
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
