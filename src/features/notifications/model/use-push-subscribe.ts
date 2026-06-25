"use client";

import { useCallback, useState } from "react";

import { urlBase64ToUint8Array } from "../lib/url-base64-to-uint8array";

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

export function usePushSubscribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        typeof Notification === "undefined"
      ) {
        setError("Уведомления не поддерживаются в этом браузере");
        return false;
      }

      const publicKey = await resolveVapidPublicKey();
      if (!publicKey) {
        setError("Push-уведомления не настроены на сервере");
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") {
          setError("Разрешение на уведомления отклонено");
        }
        return false;
      }

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
        return false;
      }

      return true;
    } catch {
      setError("Не удалось включить уведомления");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribe, loading, error };
}
