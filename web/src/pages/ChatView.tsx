import { useEffect, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { Message } from '@/components/features/Message'
import { ThreadPanel } from '@/components/features/ThreadPanel'
import { useChatStore } from '@/stores/chatStore'
import { useUIStore } from '@/stores/uiStore'
import { useChannel } from '@/hooks/useChannel'
import { Message as MessageType } from '@/types'

export function ChatView() {
  const { activeItem, activeCategory } = useUIStore()
  const { channels, directMessages, messages, fetchMessages, sendMessage, addMessage } =
    useChatStore()
  const [messageText, setMessageText] = useState('')
  const [openThread, setOpenThread] = useState<MessageType | null>(null)

  const entityId = activeItem?.id
  const entityType = activeCategory === 'channels' ? 'channel' : 'dm'
  const item =
    activeCategory === 'channels'
      ? channels.find((c) => c.id === entityId)
      : directMessages.find((d) => d.id === entityId)

  const chatMessages = entityId ? messages[`${entityType}:${entityId}`] || [] : []
  const topLevelMessages = chatMessages.filter((m) => !m.parentId)
  const threadMessages = chatMessages.filter((m) => m.parentId)

  // Subscribe to channel for real-time updates
  const channel = useChannel(
    entityId ? `${entityType}:${entityId}` : '',
    (event, payload) => {
      if (event === 'new_message') {
        addMessage(payload)
      }
    }
  )

  useEffect(() => {
    if (entityId) {
      fetchMessages(entityType, entityId)
    }
  }, [entityId, entityType, fetchMessages])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !entityId) return

    try {
      await sendMessage(entityType, entityId, messageText)
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const getThreadReplies = (messageId: string) => {
    return threadMessages.filter((m) => m.parentId === messageId)
  }

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dark-text-muted">
          Select a {activeCategory === 'channels' ? 'channel' : 'conversation'} to view messages
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-dark-border">
          <h1 className="text-2xl font-bold text-dark-text">
            {activeCategory === 'channels' ? '#' : ''} {item.name}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {topLevelMessages.map((message) => {
            const replies = getThreadReplies(message.id)
            const quotedMessage = message.quoteId
              ? chatMessages.find((m) => m.id === message.quoteId)
              : undefined

            return (
              <div key={message.id}>
                <Message
                  message={message}
                  quotedMessage={quotedMessage}
                  onReply={() => setOpenThread(message)}
                  onQuote={() => setOpenThread(message)}
                />
                {replies.length > 0 && (
                  <button
                    onClick={() => setOpenThread(message)}
                    className="ml-14 mb-2 text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-dark-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={`Message ${item.name}`}
              className="flex-1 px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {openThread && (
        <ThreadPanel
          parentMessage={openThread}
          threadMessages={threadMessages}
          onClose={() => setOpenThread(null)}
        />
      )}
    </div>
  )
}
