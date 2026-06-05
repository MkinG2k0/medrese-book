import { LevelStatsChart } from "@/features/analytics/ui/LevelStats";
import { TopStudents } from "@/features/analytics/ui/TopStudents";
import { getLevelStats, getTopStudents } from "@/shared/lib/analytics";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

export default async function AnalyticsPage() {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);

  const [topStudents, levelStats] = await Promise.all([
    getTopStudents(new Date()),
    getLevelStats(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <Title level={3}>Аналитика</Title>
      <TopStudents data={topStudents} />
      <LevelStatsChart data={levelStats} />
    </div>
  );
}
