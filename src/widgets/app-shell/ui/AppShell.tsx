"use client"

import {
	BookOutlined,
	HomeOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	UserOutlined,
} from "@ant-design/icons"
import { Button, Layout, Menu, Typography } from "antd"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

const { Header, Sider, Content, Footer } = Layout

const menuItems = [
	{ key: "/", icon: <HomeOutlined />, label: "Главная" },
	{ key: "/program", icon: <BookOutlined />, label: "Программа" },
	{ key: "/profile", icon: <UserOutlined />, label: "Профиль" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const router = useRouter()
	const [collapsed, setCollapsed] = useState(false)

	const selectedKey =
		menuItems.find((item) =>
			item.key === "/" ? pathname === "/" : pathname.startsWith(item.key),
		)?.key ?? "/"

	return (
		<Layout className="h-screen min-h-screen" style={{ minHeight: '100vh', height: '100vh' }}>
			<Sider
				collapsible
				collapsed={collapsed}
				onCollapse={setCollapsed}
				trigger={null}
				width={240}
				className="!h-full !bg-[#12100e]"
			>
				<div className="flex h-16 items-center justify-center px-4">
					<Link href="/" className="font-display text-lg text-[#E8E0D0] no-underline">
						{collapsed ? "К" : "Коран"}
					</Link>
				</div>
				<Menu
					mode="inline"
					selectedKeys={[selectedKey]}
					items={menuItems}
					onClick={({ key }) => router.push(key)}
					className="border-none bg-transparent"
				/>
			</Sider>

			<Layout className="flex min-h-0 flex-1 flex-col">
				<Header className="flex shrink-0 items-center gap-4 px-6 !bg-[#161412] !leading-none">
					<Button
						type="text"
						icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
						onClick={() => setCollapsed((value) => !value)}
						className="!text-[#E8E0D0]"
					/>
					<Typography.Title level={4} className="!mb-0 !text-[#E8E0D0]">
						Чтение Корана
					</Typography.Title>
				</Header>

				<Content className="mx-4 my-4 min-h-0 flex-1 overflow-auto rounded-lg p-6">
					{children}
				</Content>

				<Footer className="shrink-0 text-center !bg-[#161412] !text-[#8a8375]">
					Платформа обучения чтению Корана
				</Footer>
			</Layout>
		</Layout>
	)
}
