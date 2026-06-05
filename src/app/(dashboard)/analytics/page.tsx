import { LevelStatsChart } from "@/features/analytics/ui/LevelStats";
import { AnalyticsMonthPicker } from "@/features/analytics/ui/AnalyticsMonthPicker";
import { TopStudents } from "@/features/analytics/ui/TopStudents";
import {
  formatAnalyticsMonth,
  getLevelStats,
  getTopStudents,
  parseAnalyticsMonth,
} from "@/shared/lib/analytics";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

type AnalyticsPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);

  const { month: monthParam } = await searchParams;
  const month = parseAnalyticsMonth(monthParam);
  const monthLabel = formatAnalyticsMonth(month);

  const [topStudents, levelStats] = await Promise.all([
    getTopStudents(month),
    getLevelStats(month),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Title level={3} className="!mb-0">
          Аналитика
        </Title>
        <AnalyticsMonthPicker month={month} />
      </div>
      <TopStudents data={topStudents} monthLabel={monthLabel} />
      <LevelStatsChart data={levelStats} monthLabel={monthLabel} />
    </div>
  );
}
