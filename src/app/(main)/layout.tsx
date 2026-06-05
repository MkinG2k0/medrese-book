import { AppShell } from "@/widgets/app-shell"

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return <AppShell>{children}</AppShell>
}
