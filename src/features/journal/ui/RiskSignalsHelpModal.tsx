"use client";

import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useState } from "react";

import { AT_RISK_CONFIG } from "@/shared/lib/student-metrics/at-risk-config";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type RiskSignalsHelpTriggerProps = {
  ariaLabel?: string;
};

export function RiskSignalsHelpTrigger({
  ariaLabel = "Подробнее о сигналах",
}: RiskSignalsHelpTriggerProps) {
  const [open, setOpen] = useState(false);
  const { attendanceMonthThreshold, attendanceConsecutiveThreshold } =
    AT_RISK_CONFIG;

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<QuestionCircleOutlined />}
        aria-label={ariaLabel}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      />
      <Modal
        title="Что значат сигналы"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={560}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4">
          <Text>
            Сигналы подсказывают, кому из учеников стоит уделить больше
            внимания. Они видны в журнале и в разделе «Требуют внимания» на
            странице аналитики.
          </Text>

          <section>
            <Title level={5}>Норматив</Title>
            <div className="mt-2 flex flex-col gap-2">
              <Text>
                Появляется, если ученик учится дольше, чем заложено программой
                на уже пройденные шаги его текущего уровня.
              </Text>
              <Text type="secondary">
                В таблице «Требуют внимания» сравниваются две колонки:
              </Text>
              <ul className="list-disc pl-5">
                <li>
                  <Text>
                    <strong>Норматив</strong> — сколько часов по программе
                    «положено» на все шаги, которые ученик уже сдал на этом
                    уровне. У каждого шага в программе есть своя норма в
                    часах; они складываются. Шаги «зачтено ранее» не считаются.
                  </Text>
                </li>
                <li>
                  <Text>
                    <strong>Время</strong> — сколько часов реально прошло на
                    ваших занятиях: сумма от «Начать урок» до «Закончить
                    урок».
                  </Text>
                </li>
              </ul>
              <Text type="secondary">
                Если «Время» больше «Норматива» — появляется сигнал. Для
                каждого уровня программы расчёт отдельный.
              </Text>
            </div>
          </section>

          <section>
            <Title level={5}>Пропуски</Title>
            <div className="mt-2 flex flex-col gap-2">
              <Text>Появляется, если:</Text>
              <ul className="list-disc pl-5">
                <li>
                  <Text>
                    за месяц у ученика {attendanceMonthThreshold} прогула и
                    больше;
                  </Text>
                </li>
                <li>
                  <Text>
                    или {attendanceConsecutiveThreshold} прогула подряд без
                    перерыва.
                  </Text>
                </li>
              </ul>
              <Text type="secondary">
                В расчёт идут только отметки «Прогул». «Пришёл» и «Опоздал» не
                считаются пропуском.
              </Text>
            </div>
          </section>

          <section>
            <Title level={5}>Кто видит</Title>
            <div className="mt-2 flex flex-col gap-2">
              <Text>
                Сигналы видят учитель и менеджер. Ученик в своём личном
                кабинете их не видит.
              </Text>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}

export function RiskSignalsColumnTitle() {
  return (
    <span className="inline-flex items-center gap-1">
      Сигналы
      <RiskSignalsHelpTrigger ariaLabel="Подробнее о колонке «Сигналы»" />
    </span>
  );
}
