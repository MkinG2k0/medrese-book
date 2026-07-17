"use client";

import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useEffect, useMemo, useState } from "react";

import {
  useEndTeachingSession,
  useStartTeachingSession,
  useTeachingSession,
} from "@/entities/teaching-session/api/use-teaching-session";
import { formatElapsedMs } from "@/features/journal/lib/format-elapsed";
import {
  formatTeachingSessionDurationLabel,
  getTeachingSessionDurationMs,
} from "@/features/journal/lib/teaching-session";
import { getLocalDateString } from "@/shared/lib/calendar-date";
import { PageLoader } from "@/shared/ui/PageLoader";
import Text from "@/shared/ui/Text";

type LessonTimerBarProps = {
  groupId: string;
  date: string;
};

function getLessonStatusTitle(
  isToday: boolean,
  isPast: boolean,
  isActive: boolean,
  session: { endedAt: string | null } | null | undefined,
) {
  if (isActive) return "Урок идёт";
  if (session?.endedAt) return isPast ? "Урок проведён" : "Урок завершён";
  if (isPast) return "Урок";
  return "Урок не начат";
}

function getLessonStatusSubtitle(
  isToday: boolean,
  isPast: boolean,
  isActive: boolean,
  session: Parameters<typeof formatTeachingSessionDurationLabel>[0],
  elapsedLabel: string,
) {
  if (isActive) return `Длительность: ${elapsedLabel}`;
  if (session?.endedAt) {
    return `Длительность: ${formatTeachingSessionDurationLabel(session)}`;
  }
  if (isPast) return "Время не учтено";
  if (isToday) {
    return "Нажмите «Начать урок», чтобы открыть журнал учеников";
  }
  return "Время не учтено";
}

export function LessonTimerBar({
  groupId,
  date,
}: LessonTimerBarProps) {
  const { message } = App.useApp();
  const today = getLocalDateString();
  const isToday = date === today;
  const isPast = date < today;
  const { data: session, isLoading } = useTeachingSession(groupId, date);
  const startMutation = useStartTeachingSession(groupId, date);
  const endMutation = useEndTeachingSession(groupId, date);
  const [elapsedLabel, setElapsedLabel] = useState("0:00");

  const isActive = session?.isActive === true;
  const statusTitle = useMemo(
    () => getLessonStatusTitle(isToday, isPast, isActive, session),
    [isToday, isPast, isActive, session],
  );
  const statusSubtitle = useMemo(
    () =>
      getLessonStatusSubtitle(isToday, isPast, isActive, session, elapsedLabel),
    [isToday, isPast, isActive, session, elapsedLabel],
  );

  useEffect(() => {
    if (!session?.isActive) return;

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
    } catch {
      message.error("Не удалось начать урок. Попробуйте ещё раз.");
    }
  };

  const handleEnd = async () => {
    if (!session?.id) return;
    try {
      await endMutation.mutateAsync(session.id);
      message.success("Урок завершён");
    } catch {
      message.error("Не удалось завершить урок. Попробуйте ещё раз.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <PageLoader size="sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Text strong className="block">
          {statusTitle}
        </Text>
        <Text type="secondary" className="block">
          {statusSubtitle}
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
