"use client";

import { cn } from "@/shared/lib/utils";
import Text from "@/shared/ui/Text";

type PageLoaderProps = {
  tip?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const MIN_HEIGHT: Record<NonNullable<PageLoaderProps["size"]>, string> = {
  sm: "min-h-20",
  md: "min-h-60",
  lg: "min-h-80",
};

export function PageLoader({ tip, className, size = "md" }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        MIN_HEIGHT[size],
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={tip ?? "Загрузка"}
    >
      <div className="relative size-10" aria-hidden="true">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-sidebar-primary" />
        <div className="absolute inset-1.5 animate-[spin_1.2s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-sidebar-primary/60" />
      </div>
      {tip ? <Text type="secondary">{tip}</Text> : null}
    </div>
  );
}
