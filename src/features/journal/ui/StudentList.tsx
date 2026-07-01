"use client";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import { useStudentRiskFlags } from "@/entities/student-metrics/api/use-student-risk-flags";
import { useStudents } from "@/entities/student/api/use-students";
import { useTeachingSession } from "@/entities/teaching-session/api/use-teaching-session";
import { useJournalStore } from "@/features/journal/model/journal-store";
import { LessonTimerBar } from "@/features/journal/ui/LessonTimerBar";
import {
  AttendanceFilter,
  buildAttendanceFilterCounts,
  filterStudentsByAttendance,
  type AttendanceFilterValue,
} from "@/features/journal/ui/AttendanceFilter";
import { JournalStudentsTable } from "@/features/journal/ui/JournalStudentsTable";
import { getLocalDateString, isFutureCalendarDay } from "@/shared/lib/calendar-date";
import type { RiskFlag } from "@/shared/lib/student-metrics/types";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type StudentListProps = {
  groupId: string;
};

export function StudentList({ groupId }: StudentListProps) {
  const { data: session } = useSession();
  const { dateFilter, setDateFilter } = useJournalStore();
  const { data: students, isLoading } = useStudents(groupId, dateFilter);
  const { data: teachingSession } = useTeachingSession(groupId, dateFilter);
  const { data: riskFlagEntries } = useStudentRiskFlags(groupId, dateFilter);
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilterValue>("ALL");

  const showRiskBadge =
    session?.user?.role === "TEACHER" || session?.user?.role === "MANAGER";

  const riskFlagsByStudentId = useMemo(() => {
    const map = new Map<string, RiskFlag[]>();
    for (const entry of riskFlagEntries ?? []) {
      map.set(entry.studentId, entry.riskFlags);
    }
    return map;
  }, [riskFlagEntries]);

  const isToday = dateFilter === getLocalDateString();
  const studentsBlocked = isToday && !teachingSession;

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  const studentsWithRiskFlags = useMemo(
    () =>
      sorted.map((student) => ({
        ...student,
        riskFlags: showRiskBadge
          ? riskFlagsByStudentId.get(student.id)
          : undefined,
      })),
    [sorted, riskFlagsByStudentId, showRiskBadge],
  );

  const attendanceCounts = useMemo(
    () => buildAttendanceFilterCounts(sorted),
    [sorted],
  );

  const filteredStudents = useMemo(
    () => filterStudentsByAttendance(studentsWithRiskFlags, attendanceFilter),
    [studentsWithRiskFlags, attendanceFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Журнал на сегодня</Title>
        <DatePicker
          value={dayjs(dateFilter)}
          disabledDate={(current) =>
            current != null &&
            isFutureCalendarDay(current.format("YYYY-MM-DD"))
          }
          onChange={(d) =>
            setDateFilter(d ? d.format("YYYY-MM-DD") : getLocalDateString())
          }
        />
      </div>

      <LessonTimerBar groupId={groupId} date={dateFilter} />

      {isLoading && <Text>Загрузка...</Text>}

      {!isLoading && sorted.length > 0 && (
        <AttendanceFilter
          value={attendanceFilter}
          onChange={setAttendanceFilter}
          counts={attendanceCounts}
        />
      )}

      {!isLoading && (
        <JournalStudentsTable
          students={filteredStudents}
          blocked={studentsBlocked}
          showRiskBadge={showRiskBadge}
        />
      )}
    </div>
  );
}
