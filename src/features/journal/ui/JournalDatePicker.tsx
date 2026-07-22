"use client";

import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { useTeachingSessionDates } from "@/entities/teaching-session/api/use-teaching-session-dates";
import { isJournalFutureDayBlocked } from "@/shared/lib/calendar-date";

type JournalDatePickerProps = {
  groupId: string;
  value: string;
  onChange: (date: string) => void;
  className?: string;
};

function getPickerPanelRange(panelDate: Dayjs) {
  const start = panelDate.startOf("month").startOf("week");
  const end = panelDate.endOf("month").endOf("week");
  return {
    from: start.format("YYYY-MM-DD"),
    to: end.format("YYYY-MM-DD"),
  };
}

export function JournalDatePicker({
  groupId,
  value,
  onChange,
  className,
}: JournalDatePickerProps) {
  const selectedDate = dayjs(value);
  const [panelDate, setPanelDate] = useState(() => selectedDate);

  useEffect(() => {
    setPanelDate(selectedDate);
  }, [value]);

  const panelRange = useMemo(
    () => getPickerPanelRange(panelDate),
    [panelDate],
  );
  const { data: lessonDates = [] } = useTeachingSessionDates(
    groupId,
    panelRange.from,
    panelRange.to,
  );
  const lessonDateSet = useMemo(
    () => new Set(lessonDates),
    [lessonDates],
  );

  return (
    <DatePicker
      value={selectedDate}
      pickerValue={panelDate}
      inputReadOnly
      className={className}
      disabledDate={(current) =>
        current != null &&
        isJournalFutureDayBlocked(current.format("YYYY-MM-DD"))
      }
      onPanelChange={(date) => {
        if (date) setPanelDate(date as Dayjs);
      }}
      cellRender={(current, info) => {
        if (info.type !== "date") return info.originNode;

        const dayKey = (current as Dayjs).format("YYYY-MM-DD");
        if (!lessonDateSet.has(dayKey)) return info.originNode;

        return (
          <div className="relative flex h-full w-full items-center justify-center">
            {info.originNode}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-400"
            />
          </div>
        );
      }}
      onChange={(d) => onChange(d ? d.format("YYYY-MM-DD") : value)}
    />
  );
}
