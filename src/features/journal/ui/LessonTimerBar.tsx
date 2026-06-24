"use client";

import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { useEffect, useState } from "react";

import {
  useEndTeachingSession,
  useStartTeachingSession,
  useTeachingSession,
} from "@/entities/teaching-session/api/use-teaching-session";
import { formatElapsedMs } from "@/features/journal/lib/format-elapsed";
import { getLocalDateString } from "@/shared/lib/calendar-date";
import Text from "@/shared/ui/Text";

type LessonTimerBarProps = {
  groupId: string;
  date: string;
};

export function LessonTimerBar({
  groupId,
  date,
}: LessonTimerBarProps) {
  const isToday = date === getLocalDateString();
  const { data: session, isLoading } = useTeachingSession(groupId, date);
  const startMutation = useStartTeachingSession(groupId, date);
  const endMutation = useEndTeachingSession(groupId, date);
  const [elapsedLabel, setElapsedLabel] = useState("0:00");

  const isActive = session?.isActive === true;

  useEffect(() => {
    if (!session?.isActive) {
      if (session?.durationMinutes != null) {
        setElapsedLabel(formatElapsedMs(session.durationMinutes * 60_000));
      }
      return;
    }

    const startedAt = new Date(session.startedAt).getTime();
    const tick = () => setElapsedLabel(formatElapsedMs(Date.now() - startedAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync();
      message.success("Урок начат");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Не удалось начать урок");
    }
  };

  const handleEnd = async () => {
    if (!session?.id) return;
    try {
      await endMutation.mutateAsync(session.id);
      message.success("Урок завершён");
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Не удалось завершить урок",
      );
    }
  };

  if (isLoading) {
    return <Text type="secondary">Загрузка статуса урока...</Text>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2a2622] bg-[#1a1714] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Text strong className="block">
          {isActive ? "Урок идёт" : session ? "Урок завершён" : "Урок не начат"}
        </Text>
        <Text type="secondary" className="block">
          {isActive || session
            ? `Длительность: ${elapsedLabel}`
            : "Нажмите «Начать урок», чтобы открыть журнал учеников"}
        </Text>
      </div>

      {isToday && !session && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={startMutation.isPending}
          onClick={() => void handleStart()}
        >
          Начать урок
        </Button>
      )}

      {isToday && isActive && (
        <Button
          danger
          icon={<StopOutlined />}
          loading={endMutation.isPending}
          onClick={() => void handleEnd()}
        >
          Закончить урок
        </Button>
      )}
    </div>
  );
}
