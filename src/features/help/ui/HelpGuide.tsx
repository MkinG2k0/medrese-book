'use client'

import { Steps, Table, Tabs } from 'antd'

import { managerGuide } from '../model/manager-guide'
import { teacherGuide } from '../model/teacher-guide'
import type { HelpFeaturePage, HelpGuide as HelpGuideData } from '../model/types'
import { HelpScreenshot } from './HelpScreenshot'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type HelpRole = 'TEACHER' | 'MANAGER' | 'SUPER_ADMIN'

type HelpGuideProps = {
  role: HelpRole
}

function OverviewSection({ guide }: { guide: HelpGuideData }) {
  return (
    <div className="flex flex-col gap-3">
      <Title level={3}>Обзор</Title>
      <Title level={4}>{guide.overview.title}</Title>
      <Text>{guide.overview.description}</Text>
      <Text type="secondary">
        Начните с вкладки «Важно знать» (автовыход, уведомления, оценки). Потом
        откройте нужный раздел меню — там картинка и простое объяснение.
      </Text>
    </div>
  )
}

function FeatureSection({ feature }: { feature: HelpFeaturePage }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Title level={3}>{feature.title}</Title>
        <Text>{feature.summary}</Text>
      </section>

      {feature.screenshots.length > 0 ? (
        <section className="flex flex-col gap-4">
          <Title level={4}>Скриншот</Title>
          {feature.screenshots.map((shot) => (
            <HelpScreenshot
              key={shot.src}
              src={shot.src}
              caption={shot.caption}
              alt={shot.caption}
            />
          ))}
        </section>
      ) : null}

      {feature.fields && feature.fields.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Title level={4}>Что здесь написано</Title>
          <Table
            size="small"
            pagination={false}
            rowKey="name"
            dataSource={feature.fields}
            columns={[
              {
                title: 'На экране',
                dataIndex: 'name',
                key: 'name',
                width: '22%',
                render: (value: string) => <Text strong>{value}</Text>,
              },
              {
                title: 'Простыми словами',
                dataIndex: 'meaning',
                key: 'meaning',
                width: '34%',
              },
              {
                title: 'Как это появляется',
                dataIndex: 'source',
                key: 'source',
              },
            ]}
          />
        </section>
      ) : null}

      {feature.howTo && feature.howTo.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Title level={4}>Как пользоваться</Title>
          <Steps
            direction="vertical"
            size="small"
            items={feature.howTo.map((step) => ({
              title: step.title,
              description: (
                <div className="flex flex-col gap-2 pb-4">
                  <Text>{step.description}</Text>
                  {step.screenshotSrc ? (
                    <HelpScreenshot
                      src={step.screenshotSrc}
                      caption={step.screenshotCaption}
                      alt={step.screenshotCaption ?? step.title}
                    />
                  ) : null}
                </div>
              ),
            }))}
          />
        </section>
      ) : null}

      {feature.tips && feature.tips.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Title level={4}>Важно знать</Title>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {feature.tips.map((tip) => (
              <li key={tip}>
                <Text>{tip}</Text>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function RoleGuideTabs({ guide }: { guide: HelpGuideData }) {
  return (
    <Tabs
      type="card"
      tabPlacement="top"
      destroyOnHidden
      items={[
        {
          key: 'overview',
          label: 'Обзор',
          children: <OverviewSection guide={guide} />,
        },
        ...guide.features.map((feature) => ({
          key: feature.key,
          label: feature.title,
          children: <FeatureSection feature={feature} />,
        })),
      ]}
    />
  )
}

export function HelpGuide({ role }: HelpGuideProps) {
  if (role === 'TEACHER') {
    return <RoleGuideTabs guide={teacherGuide} />
  }

  return (
    <Tabs
      defaultActiveKey="manager"
      items={[
        {
          key: 'manager',
          label: 'Справка менеджера',
          children: <RoleGuideTabs guide={managerGuide} />,
        },
        {
          key: 'teacher',
          label: 'Справка учителя',
          children: <RoleGuideTabs guide={teacherGuide} />,
        },
      ]}
    />
  )
}
