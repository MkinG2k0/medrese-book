'use client'

import { Collapse, Steps, Tabs } from 'antd'

import { managerGuide } from '../model/manager-guide'
import { teacherGuide } from '../model/teacher-guide'
import type { HelpGuide as HelpGuideData } from '../model/types'
import { HelpScreenshot } from './HelpScreenshot'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type HelpRole = 'TEACHER' | 'MANAGER' | 'SUPER_ADMIN'

type HelpGuideProps = {
  role: HelpRole
}

function GuideSections({ guide }: { guide: HelpGuideData }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Title level={3}>Обзор</Title>
        <Title level={4}>{guide.overview.title}</Title>
        <Text>{guide.overview.description}</Text>
      </section>

      <section className="flex flex-col gap-3">
        <Title level={3}>Возможности</Title>
        <Collapse
          items={guide.features.map((feature, index) => ({
            key: String(index),
            label: feature.title,
            children: (
              <div className="flex flex-col gap-3">
                <Text>{feature.description}</Text>
                {feature.screenshotSrc ? (
                  <HelpScreenshot
                    src={feature.screenshotSrc}
                    caption={feature.screenshotCaption}
                    alt={feature.screenshotCaption ?? feature.title}
                  />
                ) : null}
              </div>
            ),
          }))}
        />
      </section>

      <section className="flex flex-col gap-6">
        <Title level={3}>Пошаговые инструкции</Title>
        {guide.walkthroughs.map((walkthrough) => (
          <div key={walkthrough.title} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Title level={4}>{walkthrough.title}</Title>
              <Text type="secondary">{walkthrough.description}</Text>
            </div>
            <Steps
              direction="vertical"
              size="small"
              items={walkthrough.steps.map((step) => ({
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
          </div>
        ))}
      </section>
    </div>
  )
}

export function HelpGuide({ role }: HelpGuideProps) {
  if (role === 'TEACHER') {
    return <GuideSections guide={teacherGuide} />
  }

  return (
    <Tabs
      defaultActiveKey="manager"
      items={[
        {
          key: 'manager',
          label: 'Менеджер',
          children: <GuideSections guide={managerGuide} />,
        },
        {
          key: 'teacher',
          label: 'Учитель',
          children: <GuideSections guide={teacherGuide} />,
        },
      ]}
    />
  )
}
