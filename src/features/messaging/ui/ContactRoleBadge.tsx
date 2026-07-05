import { Tag } from "antd";

import { getContactRoleLabel } from "@/features/messaging/lib/contact-labels";

type ContactRoleBadgeProps = {
  role: string;
};

export function ContactRoleBadge({ role }: ContactRoleBadgeProps) {
  return <Tag className="m-0">{getContactRoleLabel(role)}</Tag>;
}
