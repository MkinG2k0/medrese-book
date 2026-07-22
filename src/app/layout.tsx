import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Amiri, Cormorant_Garamond, Mulish } from "next/font/google";
import type { Metadata, Viewport } from "next";

import { Providers } from "@/shared/providers";
import { SITE_NAME } from "@/shared/lib/site";

import "./globals.css";

const mulish = Mulish({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Электронный дневник посещаемости и успеваемости учеников медресе",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      className={`${mulish.variable} ${cormorant.variable} ${amiri.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="font-body h-full min-h-screen bg-background text-foreground antialiased">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
