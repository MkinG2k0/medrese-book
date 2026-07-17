"use client";

import { BellOutlined } from "@ant-design/icons";
import { Badge, Dropdown } from "antd";
import { useState } from "react";

import { useNotificationStream, useUnreadCount } from "@/entities/notification";

import { usePushAutoSubscribe } from "../model/use-push-auto-subscribe";
import { NotificationList } from "./NotificationList";
import { PushSubscribePrompt } from "./PushSubscribePrompt";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  useNotificationStream();
  usePushAutoSubscribe();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => (
        <div className="flex w-[360px] flex-col rounded-lg border border-border bg-popover shadow-lg">
          <NotificationList onClose={() => setOpen(false)} />
          <PushSubscribePrompt />
        </div>
      )}
    >
      <button
        type="button"
        className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted"
        aria-label="Уведомления"
      >
        <Badge
          count={open ? 0 : unreadCount}
          showZero={false}
          size="small"
          overflowCount={99}
        >
          <BellOutlined className="text-lg" />
        </Badge>
      </button>
    </Dropdown>
  );
}
