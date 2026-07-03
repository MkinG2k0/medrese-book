"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type {
  ConversationSummary,
  MessageContact,
} from "@/entities/conversation";
import { useConversations } from "@/entities/conversation";
import { ChatPanel } from "@/features/messaging/ui/ChatPanel";
import { ConversationList } from "@/features/messaging/ui/ConversationList";
import { useIsMobile } from "@/shared/lib/use-breakpoint";

export function MessagesPage() {
  const searchParams = useSearchParams();
  const conversationFromUrl = searchParams.get("conversation");
  const { data, isLoading, refetch } = useConversations();
  const isMobile = useIsMobile();
  const mine = data?.mine ?? [];
  const teacherChats = data?.teacherChats ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(
    conversationFromUrl,
  );

  useEffect(() => {
    if (conversationFromUrl) {
      setSelectedId(conversationFromUrl);
    }
  }, [conversationFromUrl]);

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

  const showList = !isMobile || !selectedId;
  const showChat = !isMobile || !!selectedId;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-[#2a2622] bg-[#161412]">
      {showList && (
        <div
          className={`flex h-full min-h-0 shrink-0 ${isMobile ? "w-full" : "md:max-w-sm"}`}
        >
          <ConversationList
            mine={mine}
            teacherChats={teacherChats}
            selectedId={selectedId}
            loading={isLoading}
            onSelect={setSelectedId}
            onStartChat={handleStartChat}
          />
        </div>
      )}
      {showChat && (
        <ChatPanel
          conversation={selectedConversation}
          onBack={isMobile && selectedId ? () => setSelectedId(null) : undefined}
        />
      )}
    </div>
  );
}
