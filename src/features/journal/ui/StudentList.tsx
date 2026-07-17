"use client";

import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { App, Button, Select } from "antd";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import { useStudentRiskFlags } from "@/entities/student-metrics/api/use-student-risk-flags";
import { useStudents } from "@/entities/student/api/use-students";
import { useTeachingSession } from "@/entities/teaching-session/api/use-teaching-session";
import type { TeacherJournalGroup } from "@/features/journal/actions/journal-actions";
import { useJournalDate } from "@/features/journal/model/use-journal-date";
import { JournalDatePicker } from "@/features/journal/ui/JournalDatePicker";
import { LessonTimerBar } from "@/features/journal/ui/LessonTimerBar";
import {
  AttendanceFilter,
  buildAttendanceFilterCounts,
  filterStudentsByAttendance,
  type AttendanceFilterValue,
} from "@/features/journal/ui/AttendanceFilter";
import { JournalStudentsTable } from "@/features/journal/ui/JournalStudentsTable";
import {
  getLocalDateString,
  isJournalFutureDayBlocked,
} from "@/shared/lib/calendar-date";
import type { RiskFlag } from "@/shared/lib/student-metrics/types";
import { PageLoader } from "@/shared/ui/PageLoader";
import Title from "@/shared/ui/Title";

type StudentListProps = {
  groups: TeacherJournalGroup[];
  defaultGroupId: string;
};

export function StudentList({ groups, defaultGroupId }: StudentListProps) {
  const { modal } = App.useApp();
  const { data: session } = useSession();
  const allowedGroupIds = useMemo(
    () => groups.map((group) => group.id),
    [groups],
  );
  const { dateFilter, setDateFilter, groupId, setGroupId } = useJournalDate({
    allowedGroupIds,
    defaultGroupId,
  });
  const { data: students, isLoading } = useStudents(groupId, dateFilter);
  const { data: teachingSession } = useTeachingSession(groupId, dateFilter);
  const { data: riskFlagEntries } = useStudentRiskFlags(groupId, dateFilter);
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilterValue>("ALL");

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: group.id,
        label: `${group.name} — ${group.subjectName}`,
      })),
    [groups],
  );

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

  const shiftDate = (days: number) => {
    const nextDate = dayjs(dateFilter).add(days, "day").format("YYYY-MM-DD");
    if (days > 0 && isJournalFutureDayBlocked(nextDate)) return;
    setDateFilter(nextDate);
  };

  const canGoForward = !isJournalFutureDayBlocked(
    dayjs(dateFilter).add(1, "day").format("YYYY-MM-DD"),
  );

  const handleGroupChange = (nextGroupId: string) => {
    if (nextGroupId === groupId) return;

    if (teachingSession?.isActive) {
      modal.confirm({
        title: "Переключить группу?",
        content: "Урок идёт в другой группе. Переключить?",
        okText: "Переключить",
        cancelText: "Отмена",
        onOk: () => setGroupId(nextGroupId),
      });
      return;
    }

    setGroupId(nextGroupId);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Title level={3} className="shrink-0">
          Журнал на сегодня
        </Title>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
          <Select
            value={groupId || undefined}
            options={groupOptions}
            onChange={handleGroupChange}
            disabled={groups.length <= 1}
            className="w-full sm:min-w-[220px]"
            aria-label="Группа"
          />
          <div className="flex w-full items-center gap-1 sm:w-auto sm:shrink-0">
            <Button
              icon={<LeftOutlined />}
              aria-label="Предыдущий день"
              onClick={() => shiftDate(-1)}
            />
            <JournalDatePicker
              groupId={groupId}
              value={dateFilter}
              onChange={setDateFilter}
              className="min-w-0 flex-1 sm:flex-none sm:w-[140px]"
            />
            <Button
              icon={<RightOutlined />}
              aria-label="Следующий день"
              disabled={!canGoForward}
              onClick={() => shiftDate(1)}
            />
          </div>
        </div>
      </div>

      <LessonTimerBar groupId={groupId} date={dateFilter} />

      {isLoading && <PageLoader size="lg" />}

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
          journalDate={dateFilter}
          journalGroupId={groupId}
        />
      )}
    </div>
  );
}
