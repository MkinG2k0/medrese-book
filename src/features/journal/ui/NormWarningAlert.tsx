import { Alert } from "antd";

type NormWarningAlertProps = {
  visible: boolean;
};

export function NormWarningAlert({ visible }: NormWarningAlertProps) {
  if (!visible) return null;

  return (
    <Alert
      type="warning"
      showIcon
      className="mb-4"
      title="Превышен норматив времени на текущем уровне"
      description="Фактическое время обучения больше суммы часов пройденных шагов программы. Обсудите с учеником план нагрузки."
    />
  );
}
