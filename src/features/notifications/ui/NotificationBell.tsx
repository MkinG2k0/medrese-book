"use client";

import { BellOutlined } from "@ant-design/icons";
import { Badge, Dropdown } from "antd";
import { useState } from "react";

import { useUnreadCount } from "@/entities/notification";

import { NotificationList } from "./NotificationList";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => (
        <div className="w-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#1a1816] shadow-lg">
          <NotificationList onClose={() => setOpen(false)} />
        </div>
      )}
    >
      <button
        type="button"
        className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-white/5"
        aria-label="Уведомления"
      >
        <Badge count={unreadCount} showZero={false} size="small">
          <BellOutlined className="text-lg" />
        </Badge>
      </button>
    </Dropdown>
  );
}
