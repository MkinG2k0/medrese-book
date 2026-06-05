"use client";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";

import { useStudents } from "@/entities/student/api/use-students";
import { useJournalStore } from "@/features/journal/model/journal-store";
import { JournalStudentsTable } from "@/features/journal/ui/JournalStudentsTable";
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
          value={dayjs(dateFilter)}
          onChange={(d) =>
            setDateFilter(d ? d.format("YYYY-MM-DD") : dateFilter)
          }
        />
      </div>

      {isLoading && <Text>Загрузка...</Text>}

      {!isLoading && (
        <JournalStudentsTable students={sorted} />
      )}
    </div>
  );
}
