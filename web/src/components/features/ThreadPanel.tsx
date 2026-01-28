import { useState, useRef, useEffect } from "react";
import { X, Bold, Italic, List, ListOrdered, Quote } from "lucide-react";
import { Message } from "./Message";
import { Message as MessageType } from "@/types";
import { useChatStore } from "@/stores/chatStore";

interface ThreadPanelProps {
  parentMessage: MessageType;
  threadMessages: MessageType[];
  onClose: () => void;
}

export function ThreadPanel({
  parentMessage,
  threadMessages,
  onClose,
}: ThreadPanelProps) {
  const [replyText, setReplyText] = useState("");
  const [quoteTarget, setQuoteTarget] = useState<MessageType | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useChatStore();

  // Focus the textarea when the panel opens
  useEffect(() => {
    setTimeout(() => {
      replyTextareaRef.current?.focus();
    }, 100);
  }, []);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await sendMessage(
        parentMessage.entityType,
        parentMessage.entityId,
        replyText,
        parentMessage.id,
        quoteTarget?.id,
      );
      setReplyText("");
      setQuoteTarget(null);
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const allMessages = threadMessages.filter(
    (m) => m.parentId === parentMessage.id,
  );
  const quotedMessages = allMessages.reduce(
    (acc, msg) => {
      if (msg.quoteId) {
        const quoted = [parentMessage, ...allMessages].find(
          (m) => m.id === msg.quoteId,
        );
        if (quoted) {
          acc[msg.id] = quoted;
        }
      }
      return acc;
    },
    {} as Record<string, MessageType>,
  );

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      <div
        className="absolute inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      <div className="absolute lg:relative top-0 right-0 bottom-0 w-[calc(100%-15rem)] lg:w-96 bg-dark-surface border-l border-dark-border flex flex-col z-50">
        <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-dark-text">Thread</h3>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Message
            message={parentMessage}
            className="border-b border-dark-border"
          />

          <div className="px-4 py-2 text-xs font-semibold text-dark-text-muted uppercase">
            {allMessages.length}{" "}
            {allMessages.length === 1 ? "Reply" : "Replies"}
          </div>

          {allMessages.map((message) => (
            <Message
              key={message.id}
              message={message}
              quotedMessage={quotedMessages[message.id]}
              onQuote={() => setQuoteTarget(message)}
            />
          ))}
        </div>

        <div className="p-4 border-t border-dark-border">
          <div className="border border-dark-border rounded-lg bg-dark-bg hover:border-gray-600 focus-within:border-blue-500 transition-colors">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-dark-border">
              <button
                className="p-1.5 rounded hover:bg-dark-surface transition-colors text-dark-text-muted hover:text-dark-text"
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button
                className="p-1.5 rounded hover:bg-dark-surface transition-colors text-dark-text-muted hover:text-dark-text"
                title="Italic"
              >
                <Italic size={18} />
              </button>
              <div className="w-px h-5 bg-dark-border mx-1" />
              <button
                className="p-1.5 rounded hover:bg-dark-surface transition-colors text-dark-text-muted hover:text-dark-text"
                title="Bullet List"
              >
                <List size={18} />
              </button>
              <button
                className="p-1.5 rounded hover:bg-dark-surface transition-colors text-dark-text-muted hover:text-dark-text"
                title="Numbered List"
              >
                <ListOrdered size={18} />
              </button>
              <button
                className="p-1.5 rounded hover:bg-dark-surface transition-colors text-dark-text-muted hover:text-dark-text"
                title="Quote"
              >
                <Quote size={18} />
              </button>
            </div>
            {quoteTarget && (
              <div className="px-3 py-2 border-b border-dark-border bg-dark-surface">
                <div className="flex items-start gap-2">
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-2 text-dark-text-muted mb-1">
                      <Quote size={14} />
                      <span>Quoting {quoteTarget.userName}</span>
                    </div>
                    <p className="text-dark-text-muted truncate">
                      {quoteTarget.text}
                    </p>
                  </div>
                  <button
                    onClick={() => setQuoteTarget(null)}
                    className="p-1 rounded hover:bg-dark-bg transition-colors text-dark-text-muted hover:text-dark-text"
                    title="Cancel quote"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-3">
              <textarea
                ref={replyTextareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Reply to thread..."
                rows={1}
                className="flex-1 bg-transparent text-dark-text placeholder:text-dark-text-muted focus:outline-none resize-none leading-6 text-base"
                style={{ minHeight: "24px", maxHeight: "200px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "24px";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Send"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transform rotate-45"
                >
                  <path
                    d="M2 14L14 2M14 2H6M14 2V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
