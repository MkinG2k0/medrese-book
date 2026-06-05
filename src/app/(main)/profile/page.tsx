"use client"

import { Typography } from "antd"

const { Paragraph, Title } = Typography

export default function ProfilePage() {
	return (
		<div>
			<Title level={2}>Профиль</Title>
			<Paragraph type="secondary">
				Здесь будут настройки ученика и прогресс обучения.
			</Paragraph>
		</div>
	)
}
