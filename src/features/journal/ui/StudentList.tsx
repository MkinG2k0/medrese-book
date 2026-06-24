"use client";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

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
import { getLocalDateString } from "@/shared/lib/calendar-date";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type StudentListProps = {
  groupId: string;
};

export function StudentList({ groupId }: StudentListProps) {
  const { dateFilter, setDateFilter } = useJournalStore();
  const { data: students, isLoading } = useStudents(groupId, dateFilter);
  const { data: teachingSession } = useTeachingSession(groupId, dateFilter);
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilterValue>("ALL");

  const isToday = dateFilter === getLocalDateString();
  const studentsBlocked = isToday && !teachingSession;

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  const attendanceCounts = useMemo(
    () => buildAttendanceFilterCounts(sorted),
    [sorted],
  );

  const filteredStudents = useMemo(
    () => filterStudentsByAttendance(sorted, attendanceFilter),
    [sorted, attendanceFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Журнал на сегодня</Title>
        <DatePicker
          value={dayjs(dateFilter)}
          onChange={(d) =>
            setDateFilter(d ? d.format("YYYY-MM-DD") : dateFilter)
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
        />
      )}
    </div>
  );
}
