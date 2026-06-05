"use client";

import { DatePicker } from "antd";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

import { useStudents } from "@/entities/student/api/use-students";
import { useJournalStore } from "@/features/journal/model/journal-store";
import { StudentCard } from "@/features/journal/ui/StudentCard";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type StudentListProps = {
  groupId: string;
};

export function StudentList({ groupId }: StudentListProps) {
  const { dateFilter, setDateFilter } = useJournalStore();
  const { data: students, isLoading } = useStudents(groupId, dateFilter);

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Журнал на сегодня</Title>
        <DatePicker
          value={parseISO(dateFilter)}
          onChange={(d) =>
            setDateFilter(d ? format(d, "yyyy-MM-dd") : dateFilter)
          }
        />
      </div>

      {isLoading && <Text>Загрузка...</Text>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((student) => (
          <StudentCard
            key={student.id}
            id={student.id}
            name={student.name}
            currentStepIdx={student.currentStepIdx}
            hasSessionToday={student.hasSessionToday}
          />
        ))}
      </div>
    </div>
  );
}
