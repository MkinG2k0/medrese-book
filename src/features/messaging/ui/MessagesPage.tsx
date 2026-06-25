"use client";

import { useMemo, useState } from "react";

import type {
  ConversationSummary,
  MessageContact,
} from "@/entities/conversation";
import { useConversations } from "@/entities/conversation";
import { ChatPanel } from "@/features/messaging/ui/ChatPanel";
import { ConversationList } from "@/features/messaging/ui/ConversationList";

export function MessagesPage() {
  const { data, isLoading, refetch } = useConversations();
  const mine = data?.mine ?? [];
  const teacherChats = data?.teacherChats ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allConversations = useMemo(
    () => [...mine, ...teacherChats],
    [mine, teacherChats],
  );

  const selectedConversation = useMemo(
    () => allConversations.find((c) => c.id === selectedId) ?? null,
    [allConversations, selectedId],
  );

  const handleStartChat = async (contact: MessageContact) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: contact.id }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    const conversation = json.data as ConversationSummary;
    await refetch();
    setSelectedId(conversation.id);
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-[#2a2622] bg-[#161412]">
      <div className="flex h-full min-h-0 shrink-0 md:max-w-sm">
        <ConversationList
          mine={mine}
          teacherChats={teacherChats}
          selectedId={selectedId}
          loading={isLoading}
          onSelect={setSelectedId}
          onStartChat={handleStartChat}
        />
      </div>
      <ChatPanel conversation={selectedConversation} />
    </div>
  );
}
