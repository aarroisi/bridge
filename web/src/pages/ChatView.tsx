import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DiscussionView } from "@/components/features/DiscussionView";
import { DiscussionThread } from "@/components/features/DiscussionThread";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { useChannel } from "@/hooks/useChannel";
import { Message as MessageType } from "@/types";

export function ChatView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { setActiveItem } = useUIStore();
  const [openThread, setOpenThread] = useState<MessageType | null>(null);
  const {
    channels,
    directMessages,
    messages,
    fetchMessages,
    sendMessage,
    addMessage,
    hasMoreMessages,
  } = useChatStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Determine entity type from URL path
  const entityType = location.pathname.startsWith("/channels")
    ? "channel"
    : "dm";
  const entityId = id;
  const item =
    entityType === "channel"
      ? Array.isArray(channels)
        ? channels.find((c) => c.id === entityId)
        : undefined
      : Array.isArray(directMessages)
        ? directMessages.find((d) => d.id === entityId)
        : undefined;

  // Set active item when component mounts or ID changes
  useEffect(() => {
    if (entityId && item) {
      setActiveItem({
        type: entityType === "channel" ? "channels" : "dms",
        id: entityId,
      });
    }
  }, [entityId, entityType, item, setActiveItem]);

  const rawChatMessages = entityId
    ? messages[`${entityType}:${entityId}`]
    : undefined;
  const validMessages = Array.isArray(rawChatMessages) ? rawChatMessages : [];
  // Backend returns messages in desc order (newest first), reverse for chat display (oldest first)
  const chatMessages = [...validMessages].reverse();

  // Subscribe to channel for real-time updates
  useChannel(entityId ? `${entityType}:${entityId}` : "", (event, payload) => {
    if (event === "new_message") {
      addMessage(payload);
    }
  });

  useEffect(() => {
    if (entityId) {
      fetchMessages(entityType, entityId);
    }
  }, [entityId, entityType, fetchMessages]);

  const handleSendMessage = async (text: string, quoteId?: string) => {
    if (!entityId) return;
    await sendMessage(entityType, entityId, text, undefined, quoteId);
  };

  const handleSendReply = async (
    parentId: string,
    text: string,
    quoteId?: string,
  ) => {
    if (!entityId) return;
    await sendMessage(entityType, entityId, text, parentId, quoteId);
  };

  const handleLoadMore = async () => {
    if (!entityId || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await fetchMessages(entityType, entityId, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">
          Select a {entityType === "channel" ? "channel" : "conversation"} to
          view messages
        </p>
      </div>
    );
  }

  const threadMessages = chatMessages.filter((m) => m.parentId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h1 className="text-2xl font-bold text-dark-text">
            {entityType === "channel" ? "#" : ""} {item.name}
          </h1>
        </div>

        <DiscussionView
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onSendReply={handleSendReply}
          placeholder={`Message ${item.name}`}
          emptyStateTitle={`No messages in ${entityType === "channel" ? "#" : ""}${item.name} yet`}
          emptyStateDescription="Be the first to send a message."
          openThread={openThread}
          onOpenThread={setOpenThread}
          hasMoreMessages={
            entityId ? hasMoreMessages(entityType, entityId) : false
          }
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
        />
      </div>

      {openThread && (
        <DiscussionThread
          parentMessage={openThread}
          threadMessages={threadMessages}
          onClose={() => setOpenThread(null)}
          onSendReply={handleSendReply}
        />
      )}
    </div>
  );
}
