"use client";

import { Collapse, Tag } from "antd";

import { BlockRenderer } from "@/features/program-admin/ui/BlockRenderer";
import { isStepPassed } from "@/shared/lib/step-completion";
import type { StepContent } from "@/shared/lib/validations/step";

const GRADE_LABELS: Record<number, string> = {
  1: "Средне",
  3: "Хорошо",
  5: "Отлично",
};

export type StudentLessonItem = {
  id: string;
  number: number;
  title: string;
  content: StepContent;
  grade: number | null;
  isCurrent: boolean;
};

type StudentLessonsListProps = {
  lessons: StudentLessonItem[];
};

export function StudentLessonsList({ lessons }: StudentLessonsListProps) {
  const defaultActiveKey = lessons.find((l) => l.isCurrent)?.id;

  return (
    <Collapse
      defaultActiveKey={defaultActiveKey ? [defaultActiveKey] : []}
      items={lessons.map((lesson) => ({
        key: lesson.id,
        label: (
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Урок {lesson.number}: {lesson.title}
            </span>
            {lesson.isCurrent && <Tag color="blue">Текущий</Tag>}
            {lesson.grade != null && (
              <Tag color={isStepPassed(lesson.grade) ? "green" : "orange"}>
                {GRADE_LABELS[lesson.grade] ?? lesson.grade}
              </Tag>
            )}
          </div>
        ),
        children: <BlockRenderer blocks={lesson.content.blocks} />,
      }))}
    />
  );
}
