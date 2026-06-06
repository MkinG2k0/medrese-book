import Text from "@/shared/ui/Text";

type LevelProgramDividerProps = {
  levelNumber: number;
  levelTitle: string;
};

export function LevelProgramDivider({
  levelNumber,
  levelTitle,
}: LevelProgramDividerProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-[#2a2622]" />
      <Text type="secondary" className="shrink-0 uppercase">
        Уровень {levelNumber} · {levelTitle}
      </Text>
      <div className="h-px flex-1 bg-[#2a2622]" />
    </div>
  );
}
