import Image from "next/image";

import { cn } from "@/shared/lib/utils";

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function AppLogo({ size = 40, className, priority = false }: AppLogoProps) {
  return (
    <Image
      src="/icon.png"
      alt="Мактаб «Ан-Нур»"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority={priority}
    />
  );
}
