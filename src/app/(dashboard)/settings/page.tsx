'use client'

import { ThemePicker } from '@/features/theme-settings'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Title level={2}>Настройки</Title>
      <section className="flex flex-col gap-3">
        <Title level={4}>Тема оформления</Title>
        <Text type="secondary">
          Выберите тему интерфейса. Выбор сохранится на этом устройстве.
        </Text>
        <ThemePicker />
      </section>
    </div>
  )
}
