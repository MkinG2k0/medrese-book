'use client'

import { Table } from 'antd'
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import type { LevelStats } from '@/shared/lib/analytics'
import Title from '@/shared/ui/Title'

export function LevelStatsChart({ data }: { data: LevelStats[] }) {
	return (
		<div className="flex flex-col gap-4">
			<Title level={4}>Статистика по уровням</Title>

			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#2a2622" />
						<XAxis dataKey="level" stroke="#8a8375" />
						<YAxis stroke="#8a8375" />
						<Tooltip />
						<Bar dataKey="avgGrade" fill="#4a9eff" name="Ср. оценка" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<Table
				dataSource={data}
				rowKey="level"
				pagination={false}
				columns={[
					{ title: 'Уровень', dataIndex: 'level', key: 'level' },
					{ title: 'Ср. оценка', dataIndex: 'avgGrade', key: 'avgGrade' },
					{ title: 'Прогулы', dataIndex: 'totalAbsences', key: 'absences' },
					{ title: 'Часы', dataIndex: 'totalHours', key: 'hours' },
				]}
			/>
		</div>
	)
}
