"use client";

import { MessageOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, List, Select, Spin } from "antd";
import { useMemo, useState } from "react";

import type {
  ConversationSummary,
  MessageContact,
} from "@/entities/conversation";
import { useMessageContacts } from "@/entities/conversation";
import { contactSubtitle } from "@/features/messaging/lib/contact-labels";
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
  getRoleLine,
}: {
  items: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getTitle: (item: ConversationSummary) => string;
  getRoleLine?: (item: ConversationSummary) => string | null;
}) {
  return (
    <List
      className="overflow-y-auto"
      dataSource={items}
      locale={{ emptyText: "Нет диалогов" }}
      renderItem={(item) => {
        const roleLine = getRoleLine?.(item) ?? null;

        return (
          <List.Item
            className={`cursor-pointer px-4! !border-[#2a2622] hover:bg-[#1e1b18] ${
              selectedId === item.id ? "bg-[#1e1b18]" : ""
            }`}
            onClick={() => onSelect(item.id)}
          >
            <List.Item.Meta
              title={getTitle(item)}
              description={
                <div className="flex flex-col gap-0.5">
                  {roleLine && (
                    <Text type="secondary" className="text-xs">
                      {roleLine}
                    </Text>
                  )}
                  {item.lastMessage && (
                    <Text type="secondary" className="truncate text-xs">
                      {item.lastMessage.body}
                    </Text>
                  )}
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
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
  const [newContactId, setNewContactId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const existingContactIds = useMemo(
    () => new Set(mine.map((c) => c.otherUser.id)),
    [mine],
  );

  const availableContacts = useMemo(
    () => contacts.filter((c) => !existingContactIds.has(c.id)),
    [contacts, existingContactIds],
  );

  const handleStart = async () => {
    if (!newContactId) return;
    const contact = contacts.find((c) => c.id === newContactId);
    if (!contact) return;
    setStarting(true);
    try {
      await onStartChat(contact);
      setNewContactId(null);
    } finally {
      setStarting(false);
    }
  };

  const hasAny = mine.length > 0 || teacherChats.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[#2a2622]">
      <div className="border-b border-[#2a2622] p-4">
        <Text strong className="mb-3 block">
          Сообщения
        </Text>
        <div className="flex gap-2">
          <Select
            className="min-w-0 flex-1"
            placeholder="Новый диалог"
            loading={contactsLoading}
            value={newContactId}
            onChange={setNewContactId}
            options={availableContacts.map((c) => ({
              value: c.id,
              label: `${c.name} (${contactSubtitle(c)})`,
            }))}
            showSearch
            optionFilterProp="label"
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!newContactId}
            loading={starting}
            onClick={() => void handleStart()}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spin />
        </div>
      ) : !hasAny ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <MessageOutlined className="text-2xl text-[#8a8375]" />
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
                getRoleLine={(item) => contactSubtitle(item.otherUser)}
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
