"use client";

import { cn } from "@/shared/lib/utils";

export type AttendanceFilterValue =
  | "ALL"
  | "UNMARKED"
  | "PRESENT"
  | "LATE"
  | "ABSENT";

export type AttendanceFilterCounts = Record<AttendanceFilterValue, number>;

const FILTER_OPTIONS: { value: AttendanceFilterValue; label: string }[] = [
  { value: "ALL", label: "Все" },
  { value: "UNMARKED", label: "Не отмечены" },
  { value: "PRESENT", label: "Пришли" },
  { value: "LATE", label: "Опоздали" },
  { value: "ABSENT", label: "Прогул" },
];

type AttendanceFilterProps = {
  value: AttendanceFilterValue;
  onChange: (value: AttendanceFilterValue) => void;
  counts: AttendanceFilterCounts;
};

export function AttendanceFilter({
  value,
  onChange,
  counts,
}: AttendanceFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.value;
        const count = counts[option.value];

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-transparent bg-sidebar-primary text-sidebar-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {option.label}
            <span
              className={cn(
                "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                isActive
                  ? "bg-white/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function buildAttendanceFilterCounts(
  students: { todayAttendance?: "PRESENT" | "LATE" | "ABSENT" | null }[],
): AttendanceFilterCounts {
  let unmarked = 0;
  let present = 0;
  let late = 0;
  let absent = 0;

  for (const student of students) {
    switch (student.todayAttendance) {
      case "PRESENT":
        present += 1;
        break;
      case "LATE":
        late += 1;
        break;
      case "ABSENT":
        absent += 1;
        break;
      default:
        unmarked += 1;
    }
  }

  return {
    ALL: students.length,
    UNMARKED: unmarked,
    PRESENT: present,
    LATE: late,
    ABSENT: absent,
  };
}

export function filterStudentsByAttendance<
  T extends { todayAttendance?: "PRESENT" | "LATE" | "ABSENT" | null },
>(students: T[], filter: AttendanceFilterValue): T[] {
  switch (filter) {
    case "UNMARKED":
      return students.filter((student) => !student.todayAttendance);
    case "PRESENT":
      return students.filter((student) => student.todayAttendance === "PRESENT");
    case "LATE":
      return students.filter((student) => student.todayAttendance === "LATE");
    case "ABSENT":
      return students.filter((student) => student.todayAttendance === "ABSENT");
    default:
      return students;
  }
}
