import { Cormorant_Garamond, Mulish } from "next/font/google";
import type { Metadata, Viewport } from "next";

import { Providers } from "@/shared/providers";

import "./globals.css";

const mulish = Mulish({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Чтение Корана",
  description: "Платформа обучения чтению Корана",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Коран",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${mulish.variable} ${cormorant.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="font-body h-full min-h-screen bg-[#0D1117] text-[#E8E0D0] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
