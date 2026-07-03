"use client";

import { DownOutlined, RightOutlined } from "@ant-design/icons";
import { Card, Flex, Form, Input, Radio, Spin, Tag } from "antd";
import { useEffect, useState } from "react";

import { getJournalStepContent } from "@/features/journal/actions/journal-actions";
import { StepContentPreview } from "@/features/program-admin/ui/StepContentPreview";
import { EMPTY_STEP_CONTENT } from "@/features/journal/lib/journal-step";
import { isStepPassed } from "@/shared/lib/step-completion";
import type { StepContent } from "@/shared/lib/validations/step";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const GRADE_OPTIONS = [
  { label: "Средне", value: 1 },
  { label: "Хорошо", value: 3 },
  { label: "Отлично", value: 5 },
] as const;

const GRADE_LABEL = Object.fromEntries(
  GRADE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<number, string>;

export type StepGradeState = {
  grade: number | null;
  note: string;
};

export const EMPTY_STEP_GRADE_STATE: StepGradeState = {
  grade: null,
  note: "",
};

type StepCardProps = {
  step: {
    id: string;
    order: number;
    title: string;
    content: StepContent;
    description?: string;
    hours: number;
  };
  totalHours: number;
  expanded: boolean;
  state: StepGradeState;
  disabled?: boolean;
  readOnly?: boolean;
  onToggleExpand: () => void;
  onStateChange: (state: StepGradeState) => void;
};

export function StepCard({
  step,
  totalHours,
  expanded,
  state,
  disabled,
  readOnly,
  onToggleExpand,
  onStateChange,
}: StepCardProps) {
  const [content, setContent] = useState<StepContent>(step.content);
  const [isContentLoading, setIsContentLoading] = useState(false);

  useEffect(() => {
    setContent(step.content);
  }, [step.id, step.content]);

  useEffect(() => {
    if (!expanded || content.blocks.length > 0) return;

    let cancelled = false;
    setIsContentLoading(true);

    void getJournalStepContent(step.id)
      .then((loaded) => {
        if (!cancelled && loaded) setContent(loaded);
      })
      .finally(() => {
        if (!cancelled) setIsContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, step.id, content.blocks.length]);

  const handleGradeChange = (grade: number) => {
    onStateChange({ ...state, grade });
  };

  const handleGradeClick = (grade: number) => {
    if (state.grade === grade) {
      onStateChange({ ...state, grade: null });
    }
  };

  const handleNoteChange = (note: string) => {
    onStateChange({ ...state, note });
  };

  return (
    <Card
      className={`w-full${!expanded ? " cursor-pointer" : ""}`}
      onClick={!expanded ? onToggleExpand : undefined}
    >
      <Flex vertical gap={8}>
        <Flex
          align="flex-start"
          gap={12}
          className={expanded ? "cursor-pointer" : undefined}
          onClick={expanded ? onToggleExpand : undefined}
        >
          <Flex vertical gap={4} className="min-w-0 flex-1">
            <Flex align="center" justify="space-between" gap={8}>
              <Flex align="center" gap={8} wrap>
                <Title level={5} className="!mb-0">
                  Шаг {step.order}
                </Title>
                {state.grade !== null && (
                  <Tag color={isStepPassed(state.grade) ? "orange" : "default"}>
                    {isStepPassed(state.grade) ? "пройден" : "не пройден"}
                  </Tag>
                )}
              </Flex>
              <Flex align="center" gap={8} className="shrink-0">
                <div className="flex gap-2">
                  <Text type="secondary">{step.hours}ч</Text>
                  {/* <Text type="secondary">итого {totalHours}ч</Text> */}
                </div>
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Flex>
            </Flex>
            <Text type="secondary">{step.title}</Text>
          </Flex>
        </Flex>

        {expanded && !disabled && (
          <Flex vertical gap={16} className="pt-2">
            <Form layout="vertical">
              <Form.Item label="Содержание" className="mb-4">
                {isContentLoading ? (
                  <Spin />
                ) : (
                  <StepContentPreview content={content ?? EMPTY_STEP_CONTENT} />
                )}
              </Form.Item>

              {step.description?.trim() && (
                <Form.Item label="Описание для учителя" className="mb-0">
                  <Text>{step.description}</Text>
                </Form.Item>
              )}
            </Form>

            <Flex vertical gap={8}>
              <Text type="secondary" className="uppercase">
                Оценка
              </Text>
              {readOnly ? (
                <>
                  <Text>
                    {state.grade !== null ? GRADE_LABEL[state.grade] : "—"}
                  </Text>
                  {state.note ? (
                    <Text type="secondary">{state.note}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Radio.Group
                    value={state.grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    {GRADE_OPTIONS.map((opt) => (
                      <Radio.Button
                        key={opt.value}
                        value={opt.value}
                        onClick={() => handleGradeClick(opt.value)}
                      >
                        {opt.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                  <Input.TextArea
                    placeholder="Заметка учителя..."
                    value={state.note}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    rows={2}
                  />
                </>
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
