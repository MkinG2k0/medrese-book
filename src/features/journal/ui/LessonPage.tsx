"use client";

import { Button, message } from "antd";
import { useState } from "react";

import { useCreateSession } from "@/entities/session/api/use-sessions";
import { AttendanceButtons } from "@/features/journal/ui/AttendanceButtons";
import { LetterContent } from "@/features/journal/ui/StepContent/LetterContent";
import { SurahContent } from "@/features/journal/ui/StepContent/SurahContent";
import { StepCard } from "@/features/journal/ui/StepCard";
import type { StepContent } from "@/shared/lib/validations/step";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type LessonPageProps = {
  studentId: string;
  studentName: string;
  step: {
    id: string;
    title: string;
    type: "LETTER" | "SURAH";
    content: StepContent;
  };
};

export function LessonPage({ studentId, studentName, step }: LessonPageProps) {
  const [attendance, setAttendance] = useState<"PRESENT" | "LATE" | "ABSENT">(
    "PRESENT",
  );
  const [lateMinutes, setLateMinutes] = useState(5);
  const [grade, setGrade] = useState<number | null>(null);
  const [note] = useState("");
  const [stepNote, setStepNote] = useState("");

  const createSession = useCreateSession();

  const handleAttendanceChange = (
    value: "PRESENT" | "LATE" | "ABSENT",
    minutes?: number,
  ) => {
    setAttendance(value);
    if (minutes !== undefined) setLateMinutes(minutes);
  };

  const handleSave = async () => {
    const completions =
      grade !== null && attendance !== "ABSENT"
        ? [{ stepId: step.id, grade, note: stepNote || null }]
        : [];

    try {
      await createSession.mutateAsync({
        studentId,
        date: new Date().toISOString(),
        attendance,
        lateMinutes: attendance === "LATE" ? lateMinutes : null,
        note: note || null,
        completions,
      });
      message.success("Сессия сохранена");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>{studentName}</Title>

      <div>
        <Title level={4}>{step.title}</Title>
        {step.type === "LETTER" ? (
          <LetterContent content={step.content} />
        ) : (
          <SurahContent content={step.content} />
        )}
      </div>

      <div>
        <Text type="secondary" className="mb-2 block">
          Посещаемость
        </Text>
        <AttendanceButtons
          value={attendance}
          lateMinutes={lateMinutes}
          onChange={handleAttendanceChange}
        />
      </div>

      {attendance !== "ABSENT" && (
        <StepCard
          title="Оценка за шаг"
          grade={grade}
          note={stepNote}
          onGradeChange={setGrade}
          onNoteChange={setStepNote}
        />
      )}

      <Button
        type="primary"
        size="large"
        onClick={handleSave}
        loading={createSession.isPending}
      >
        Сохранить
      </Button>
    </div>
  );
}
