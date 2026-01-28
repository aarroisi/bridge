import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Message } from './Message'
import { Message as MessageType } from '@/types'
import { useChatStore } from '@/stores/chatStore'

interface ThreadPanelProps {
  parentMessage: MessageType
  threadMessages: MessageType[]
  onClose: () => void
}

export function ThreadPanel({ parentMessage, threadMessages, onClose }: ThreadPanelProps) {
  const [replyText, setReplyText] = useState('')
  const [quoteTarget, setQuoteTarget] = useState<MessageType | null>(null)
  const { sendMessage } = useChatStore()

  const handleSendReply = async () => {
    if (!replyText.trim()) return

    try {
      await sendMessage(
        parentMessage.entityType,
        parentMessage.entityId,
        replyText,
        parentMessage.id,
        quoteTarget?.id
      )
      setReplyText('')
      setQuoteTarget(null)
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  const allMessages = threadMessages.filter((m) => m.parentId === parentMessage.id)
  const quotedMessages = allMessages.reduce((acc, msg) => {
    if (msg.quoteId) {
      const quoted = [parentMessage, ...allMessages].find((m) => m.id === msg.quoteId)
      if (quoted) {
        acc[msg.id] = quoted
      }
    }
    return acc
  }, {} as Record<string, MessageType>)

  return (
    <div className="w-96 bg-dark-surface border-l border-dark-border flex flex-col">
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
        <Message message={parentMessage} className="border-b border-dark-border" />

        <div className="px-4 py-2 text-xs font-semibold text-dark-text-muted uppercase">
          {allMessages.length} {allMessages.length === 1 ? 'Reply' : 'Replies'}
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
        {quoteTarget && (
          <div className="mb-2 px-3 py-2 bg-dark-bg rounded border border-dark-border flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-dark-text-muted">
                Quoting {quoteTarget.userName}
              </div>
              <p className="text-sm text-dark-text mt-1 truncate">
                {quoteTarget.text}
              </p>
            </div>
            <button
              onClick={() => setQuoteTarget(null)}
              className="text-dark-text-muted hover:text-dark-text ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            placeholder="Reply to thread..."
            className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
