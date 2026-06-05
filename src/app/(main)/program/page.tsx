"use client"

import { Typography } from "antd"

const { Paragraph, Title } = Typography

export default function ProgramPage() {
	return (
		<div>
			<Title level={2}>Программа</Title>
			<Paragraph type="secondary">
				Здесь будет список уроков и шагов программы обучения.
			</Paragraph>
		</div>
	)
}
