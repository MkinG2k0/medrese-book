"use client";

import { Button } from "antd";
import { useCallback, useEffect, useState } from "react";

import Text from "@/shared/ui/Text";

import { usePushSubscribe } from "../model/use-push-subscribe";

const DISMISSED_KEY = "push-prompt-dismissed";
const DENIED_KEY = "push-prompt-denied";

export function PushSubscribePrompt() {
  const [visible, setVisible] = useState(false);
  const { subscribe, loading, error } = usePushSubscribe();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined") return;

    if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(DENIED_KEY)) {
      return;
    }

    if (Notification.permission === "denied") {
      localStorage.setItem(DENIED_KEY, "1");
      return;
    }

    // Спрашиваем только пока разрешение ещё не выдано.
    // Если уже granted — silent re-subscribe через usePushAutoSubscribe.
    if (Notification.permission === "default") {
      setVisible(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }, []);

  const handleSubscribe = useCallback(async () => {
    const ok = await subscribe();
    if (ok || (typeof Notification !== "undefined" && Notification.permission === "granted")) {
      setVisible(false);
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      localStorage.setItem(DENIED_KEY, "1");
      setVisible(false);
    }
  }, [subscribe]);

  if (!visible) return null;

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <Text className="mb-2 block text-sm">
        Получайте уведомления о сообщениях, заявках и замещениях даже при
        закрытой вкладке
      </Text>
      {error ? (
        <Text type="danger" className="mb-2 block text-sm">
          {error}
        </Text>
      ) : null}
      <div className="flex gap-2">
        <Button type="primary" size="small" loading={loading} onClick={() => void handleSubscribe()}>
          Включить уведомления
        </Button>
        <Button size="small" onClick={handleDismiss} disabled={loading}>
          Не сейчас
        </Button>
      </div>
    </div>
  );
}
