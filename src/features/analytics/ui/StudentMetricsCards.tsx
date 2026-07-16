import { Card, Statistic } from "antd";

import { formatMinutesAsHours } from "@/shared/lib/format-minutes-as-hours";
import Text from "@/shared/ui/Text";

export type StudentMetricsCardsData = {
  lessonsCount: number;
  stepsCount: number;
  totalMinutes: number;
  monthLabel: string;
};

type StudentMetricsCardsProps = {
  metrics: StudentMetricsCardsData;
  variant: "compact" | "portal";
};

function MetricsContent({
  metrics,
  variant,
}: {
  metrics: StudentMetricsCardsData;
  variant: "compact" | "portal";
}) {
  if (variant === "compact") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Statistic title="Уроков" value={metrics.lessonsCount} />
        <Statistic title="Шагов" value={metrics.stepsCount} />
        <Statistic
          title="Время обучения"
          value={formatMinutesAsHours(metrics.totalMinutes)}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card size="small">
        <Statistic title="Уроков" value={metrics.lessonsCount} />
      </Card>
      <Card size="small">
        <Statistic title="Шагов" value={metrics.stepsCount} />
      </Card>
      <Card size="small">
        <Statistic
          title="Время обучения"
          value={formatMinutesAsHours(metrics.totalMinutes)}
        />
      </Card>
    </div>
  );
}

export function StudentMetricsCards({
  metrics,
  variant,
}: StudentMetricsCardsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text type="secondary">За {metrics.monthLabel}</Text>
      <MetricsContent metrics={metrics} variant={variant} />
    </div>
  );
}
