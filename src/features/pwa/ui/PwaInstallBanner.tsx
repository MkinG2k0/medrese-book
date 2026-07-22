"use client";

import { CloseOutlined, DownloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback, useEffect, useState } from "react";

import { hasPushSubscription } from "@/features/notifications/lib/push-subscription-status";
import { usePushSubscribe } from "@/features/notifications/model/use-push-subscribe";
import Text from "@/shared/ui/Text";

import { usePwaInstall } from "../model/use-pwa-install";

export function PwaInstallBanner() {
  const {
    canInstall,
    isInstalled,
    isStandalone,
    isIos,
    dismissed,
    dismiss,
    promptInstall,
  } = usePwaInstall();
  const inPwa = isStandalone || isInstalled;
  const { subscribe, loading, error } = usePushSubscribe();
  const [installLoading, setInstallLoading] = useState(false);
  const [pushReady, setPushReady] = useState(false);
  const [showPushCta, setShowPushCta] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    void (async () => {
      // Спрашиваем только пока браузер ещё не решил (default).
      // При granted/denied баннер не показываем — подписку делает usePushAutoSubscribe.
      if (Notification.permission !== "default") {
        setShowPushCta(false);
        setPushReady(
          Notification.permission === "granted" && (await hasPushSubscription()),
        );
        return;
      }

      setPushReady(false);
      setShowPushCta(true);
    })();
  }, [inPwa]);

  const handleInstall = useCallback(async () => {
    setInstallLoading(true);
    try {
      await promptInstall();
    } finally {
      setInstallLoading(false);
    }
  }, [promptInstall]);

  const handleSubscribe = useCallback(async () => {
    const ok = await subscribe();
    // После выдачи разрешения больше не спрашиваем (подписку догонит auto-subscribe).
    if (ok || Notification.permission === "granted") {
      setPushReady(ok);
      setShowPushCta(false);
    }
  }, [subscribe]);

  const showInstallBanner =
    !dismissed && !inPwa && (canInstall || isIos);

  if (!showInstallBanner && !showPushCta) return null;
  if (showPushCta && pushReady) return null;

  return (
    <div className="shrink-0 border-b border-border bg-card px-4 py-2 sm:px-6">
      {showInstallBanner ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {canInstall ? (
              <>
                <Text className="block text-sm">
                  Установите приложение на телефон для быстрого доступа
                </Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={installLoading}
                    onClick={() => void handleInstall()}
                  >
                    Установить
                  </Button>
                  <Button size="small" onClick={dismiss} disabled={installLoading}>
                    Не сейчас
                  </Button>
                </div>
              </>
            ) : isIos ? (
              <Text className="block text-sm">
                Чтобы установить: нажмите «Поделиться» в Safari, затем «На экран
                «Домой»»
              </Text>
            ) : null}
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={dismiss}
            aria-label="Скрыть"
            className="shrink-0"
          />
        </div>
      ) : null}

      {showPushCta && !pushReady ? (
        <div className={showInstallBanner ? "mt-2 border-t border-white/10 pt-2" : ""}>
          <Text className="mb-2 block text-sm">
            Получайте уведомления о сообщениях, отпусках и заявках даже при
            закрытом приложении
          </Text>
          {error ? (
            <Text type="danger" className="mb-2 block text-sm">
              {error}
            </Text>
          ) : null}
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={() => void handleSubscribe()}
          >
            Включить уведомления
          </Button>
        </div>
      ) : null}
    </div>
  );
}
