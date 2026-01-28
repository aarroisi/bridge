import { formatDistanceToNow } from "date-fns";
import { Reply, Quote } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Message as MessageType } from "@/types";
import { clsx } from "clsx";

interface MessageProps {
  message: MessageType;
  quotedMessage?: MessageType;
  onReply?: () => void;
  onQuote?: () => void;
  onQuotedClick?: (messageId: string) => void;
  className?: string;
}

export function Message({
  message,
  quotedMessage,
  onReply,
  onQuote,
  onQuotedClick,
  className,
}: MessageProps) {
  // Use the quote from the message itself if not provided
  const displayQuote = quotedMessage || message.quote;
  return (
    <div
      className={clsx(
        "flex gap-3 px-4 py-3 hover:bg-dark-surface/50 group",
        className,
      )}
    >
      <Avatar name={message.userName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-dark-text text-sm">
            {message.userName}
          </span>
          <span className="text-xs text-dark-text-muted">
            {formatDistanceToNow(new Date(message.insertedAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {displayQuote && (
          <button
            onClick={() => onQuotedClick?.(displayQuote.id)}
            className="mt-1 mb-2 pl-3 border-l-2 border-blue-500/50 bg-dark-surface/50 rounded py-1 px-2 hover:bg-dark-surface transition-colors w-full text-left"
          >
            <div className="text-xs text-dark-text-muted flex items-center gap-1">
              <Quote size={12} />
              <span className="font-semibold">{displayQuote.userName}</span>
            </div>
            <p className="text-sm text-dark-text-muted mt-1 line-clamp-2">
              {displayQuote.text}
            </p>
          </button>
        )}

        <p className="text-base text-dark-text mt-1 whitespace-pre-wrap break-words">
          {message.text}
        </p>

        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onReply && (
            <button
              onClick={onReply}
              className="text-xs text-dark-text-muted hover:text-blue-400 flex items-center gap-1"
            >
              <Reply size={12} />
              Reply
            </button>
          )}
          {onQuote && (
            <button
              onClick={onQuote}
              className="text-xs text-dark-text-muted hover:text-blue-400 flex items-center gap-1"
            >
              <Quote size={12} />
              Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
