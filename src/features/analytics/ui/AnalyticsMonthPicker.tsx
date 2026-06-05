"use client";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";

type AnalyticsMonthPickerProps = {
  month: Date;
};

export function AnalyticsMonthPicker({ month }: AnalyticsMonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DatePicker
      picker="month"
      value={dayjs(month)}
      onChange={(value) => {
        if (!value) return;
        router.push(`${pathname}?month=${value.format("YYYY-MM")}`);
      }}
      allowClear={false}
      format="MMMM YYYY"
      className="w-full sm:w-auto"
    />
  );
}
