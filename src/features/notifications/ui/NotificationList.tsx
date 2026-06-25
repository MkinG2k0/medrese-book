"use client";

import { Button, Spin } from "antd";
import { useRouter } from "next/navigation";

import {
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
  type NotificationItem,
} from "@/entities/notification";
import { formatDateShort } from "@/shared/lib/utils";
import Text from "@/shared/ui/Text";

type NotificationListProps = {
  onClose?: () => void;
};

export function NotificationList({ onClose }: NotificationListProps) {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();

  const unreadCount = unreadData?.count ?? 0;

  const handleItemClick = (item: NotificationItem) => {
    if (!item.readAt) {
      markRead.mutate({ ids: [item.id] });
    }
    if (item.link) {
      onClose?.();
      router.push(item.link);
    }
  };

  const handleMarkAllRead = () => {
    markRead.mutate({ all: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <Text type="secondary">Нет новых уведомлений</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain">
        <ul className="m-0 list-none p-0 pb-2">
          {notifications.map((item) => {
            const isUnread = item.readAt === null;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={
                    isUnread
                      ? "flex w-full cursor-pointer gap-3 border-0 bg-white/3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      : "flex w-full cursor-pointer gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-white/5"
                  }
                  onClick={() => handleItemClick(item)}
                >
                  <span
                    className={
                      isUnread
                        ? "mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-red-500"
                        : "mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-transparent"
                    }
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    {isUnread ? (
                      <Text strong className="block">
                        {item.title}
                      </Text>
                    ) : (
                      <Text className="block">{item.title}</Text>
                    )}
                    <Text type="secondary" className="mt-1 block">
                      {item.body}
                    </Text>
                    <Text type="secondary" className="mt-1 block">
                      {formatDateShort(item.createdAt)}
                    </Text>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {unreadCount > 0 && (
        <div className="shrink-0 border-t border-white/10 px-4 py-2">
          <Button
            type="link"
            block
            onClick={handleMarkAllRead}
            loading={markRead.isPending}
          >
            Отметить все прочитанными
          </Button>
        </div>
      )}
    </div>
  );
}
