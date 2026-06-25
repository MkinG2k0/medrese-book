"use client";

import { Button } from "antd";
import { useCallback, useEffect, useState } from "react";

import Text from "@/shared/ui/Text";

import { urlBase64ToUint8Array } from "../lib/url-base64-to-uint8array";

const DISMISSED_KEY = "push-prompt-dismissed";
const DENIED_KEY = "push-prompt-denied";

async function resolveVapidPublicKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (fromEnv) return fromEnv;

  try {
    const res = await fetch("/api/push/vapid-public");
    const json = (await res.json()) as {
      data: { publicKey: string | null } | null;
      error: string | null;
    };
    if (json.error) return null;
    return json.data?.publicKey ?? null;
  } catch {
    return null;
  }
}

export function PushSubscribePrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (Notification.permission === "default") {
      setVisible(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }, []);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const publicKey = await resolveVapidPublicKey();
      if (!publicKey) {
        setError("Push-уведомления не настроены на сервере");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        localStorage.setItem(DENIED_KEY, "1");
        setVisible(false);
        return;
      }
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const json = (await res.json()) as { error: string | null };
      if (json.error) {
        setError(json.error);
        return;
      }

      setVisible(false);
    } catch {
      setError("Не удалось включить уведомления");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <Text className="mb-2 block text-sm">
        Получайте уведомления о заявках и замещениях даже при закрытой вкладке
      </Text>
      {error ? (
        <Text type="danger" className="mb-2 block text-sm">
          {error}
        </Text>
      ) : null}
      <div className="flex gap-2">
        <Button type="primary" size="small" loading={loading} onClick={handleSubscribe}>
          Включить уведомления
        </Button>
        <Button size="small" onClick={handleDismiss} disabled={loading}>
          Не сейчас
        </Button>
      </div>
    </div>
  );
}
