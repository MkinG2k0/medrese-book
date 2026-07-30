"use client";

import { MessageOutlined } from "@ant-design/icons";
import { Select, Spin } from "antd";
import { useMemo, useState } from "react";

import type {
  ConversationSummary,
  MessageContact,
} from "@/entities/conversation";
import { useMessageContacts } from "@/entities/conversation";
import { getContactRoleLabel } from "@/features/messaging/lib/contact-labels";
import { ContactRoleBadge } from "@/features/messaging/ui/ContactRoleBadge";
import Text from "@/shared/ui/Text";

type ConversationListProps = {
  mine: ConversationSummary[];
  teacherChats: ConversationSummary[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onStartChat: (contact: MessageContact) => Promise<void>;
};

function ConversationItems({
  items,
  selectedId,
  onSelect,
  getTitle,
  getRole,
}: {
  items: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getTitle: (item: ConversationSummary) => string;
  getRole?: (item: ConversationSummary) => string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <Text type="secondary">Нет диалогов</Text>
      </div>
    );
  }

  return (
    <ul className="m-0 list-none divide-y divide-border overflow-y-auto p-0">
      {items.map((item) => {
        const role = getRole?.(item) ?? null;
        const isSelected = selectedId === item.id;

        return (
          <li key={item.id}>
            <button
              type="button"
              className={`flex w-full cursor-pointer border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-muted ${
                isSelected ? "bg-muted" : ""
              }`}
              onClick={() => onSelect(item.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Text strong>{getTitle(item)}</Text>
                  {role && <ContactRoleBadge role={role} />}
                </div>
                <div className="flex flex-col gap-0.5">
                  {item.lastMessage && (
                    <Text type="secondary" className="truncate text-xs">
                      {item.lastMessage.body}
                    </Text>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ConversationList({
  mine,
  teacherChats,
  selectedId,
  loading,
  onSelect,
  onStartChat,
}: ConversationListProps) {
  const { data: contacts = [], isLoading: contactsLoading } =
    useMessageContacts();
  const [starting, setStarting] = useState(false);

  const existingContactIds = useMemo(
    () => new Set(mine.map((c) => c.otherUser.id)),
    [mine],
  );

  const availableContacts = useMemo(
    () => contacts.filter((c) => !existingContactIds.has(c.id)),
    [contacts, existingContactIds],
  );

  const handleContactSelect = async (contactId: string | null) => {
    if (!contactId) return;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setStarting(true);
    try {
      await onStartChat(contact);
    } finally {
      setStarting(false);
    }
  };

  const hasAny = mine.length > 0 || teacherChats.length > 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-border">
      <div className="border-b border-border p-4">
        <Text strong className="mb-3 block">
          Сообщения
        </Text>
        <Select
          className="w-full"
          placeholder="Новый диалог"
          loading={contactsLoading || starting}
          value={null}
          onChange={(contactId) => void handleContactSelect(contactId)}
          options={availableContacts.map((c) => ({
            value: c.id,
            label: `${c.name} ${getContactRoleLabel(c.role)}`,
            contact: c,
          }))}
          optionRender={(option) => (
            <div className="flex items-center justify-between gap-2">
              <span>{option.data.contact.name}</span>
              <ContactRoleBadge role={option.data.contact.role} />
            </div>
          )}
          showSearch
          optionFilterProp="label"
          allowClear
        />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spin />
        </div>
      ) : !hasAny ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <MessageOutlined className="text-2xl text-muted-foreground" />
          <Text type="secondary">Нет диалогов. Начните новый чат.</Text>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {mine.length > 0 && (
            <div>
              {teacherChats.length > 0 && (
                <Text
                  type="secondary"
                  className="block px-4 pb-1 pt-3 text-xs uppercase"
                >
                  Мои чаты
                </Text>
              )}
              <ConversationItems
                items={mine}
                selectedId={selectedId}
                onSelect={onSelect}
                getTitle={(item) => item.otherUser.name}
                getRole={(item) => item.otherUser.role}
              />
            </div>
          )}
          {teacherChats.length > 0 && (
            <div>
              <Text
                type="secondary"
                className="block px-4 pb-1 pt-3 text-xs uppercase"
              >
                Диалоги учителей
              </Text>
              <ConversationItems
                items={teacherChats}
                selectedId={selectedId}
                onSelect={onSelect}
                getTitle={(item) => item.title ?? item.otherUser.name}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
