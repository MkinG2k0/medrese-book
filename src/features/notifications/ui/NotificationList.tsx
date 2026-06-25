"use client";

import { Button, List, Spin } from "antd";
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
    <div className="flex max-h-[420px] flex-col">
      <List
        className="min-h-0 flex-1 overflow-y-auto"
        dataSource={notifications}
        split={false}
        renderItem={(item) => {
          const isUnread = item.readAt === null;

          return (
            <List.Item
              className={
                isUnread
                  ? "cursor-pointer px-4 py-3 transition-colors hover:bg-white/5 bg-white/3"
                  : "cursor-pointer px-4 py-3 transition-colors hover:bg-white/5"
              }
              onClick={() => handleItemClick(item)}
            >
              <div className="w-full">
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
            </List.Item>
          );
        }}
      />
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
