import { useState } from 'react'
import { X, Plus, MessageSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Message } from './Message'
import { ThreadPanel } from './ThreadPanel'
import { Task, Subtask, Message as MessageType } from '@/types'
import { useListStore } from '@/stores/listStore'
import { useChatStore } from '@/stores/chatStore'
import { clsx } from 'clsx'

interface TaskDetailPanelProps {
  task: Task
  subtasks: Subtask[]
  comments: MessageType[]
  onClose: () => void
}

export function TaskDetailPanel({ task, subtasks, comments, onClose }: TaskDetailPanelProps) {
  const [openThread, setOpenThread] = useState<MessageType | null>(null)
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const { updateTask, updateSubtask, createSubtask } = useListStore()
  const { sendMessage } = useChatStore()

  const handleStatusChange = async (status: 'todo' | 'doing' | 'done') => {
    await updateTask(task.id, { status })
  }

  const handleSubtaskStatusChange = async (subtaskId: string, status: 'todo' | 'doing' | 'done') => {
    await updateSubtask(subtaskId, { status })
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    await createSubtask(task.id, { title: newSubtask, status: 'todo' })
    setNewSubtask('')
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    await sendMessage('task', task.id, newComment)
    setNewComment('')
  }

  const topLevelComments = comments.filter((c) => !c.parentId)
  const threadMessages = comments.filter((c) => c.parentId)

  const getThreadReplies = (messageId: string) => {
    return threadMessages.filter((m) => m.parentId === messageId)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col bg-dark-bg border-l border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-dark-text mb-2">{task.title}</h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={task.status} />
              {task.assigneeName && (
                <div className="flex items-center gap-2 text-sm text-dark-text-muted">
                  <Avatar name={task.assigneeName} size="xs" />
                  <span>{task.assigneeName}</span>
                </div>
              )}
              {task.dueOn && (
                <div className="flex items-center gap-1 text-sm text-dark-text-muted">
                  <Calendar size={14} />
                  <span>{format(new Date(task.dueOn), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status Section */}
          <div className="px-6 py-4 border-b border-dark-border">
            <label className="block text-sm font-medium text-dark-text mb-2">Status</label>
            <div className="flex gap-2">
              {(['todo', 'doing', 'done'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={clsx(
                    'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    task.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-surface text-dark-text-muted hover:bg-dark-border'
                  )}
                >
                  {status === 'todo' ? 'To Do' : status === 'doing' ? 'Doing' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          {task.notes && (
            <div className="px-6 py-4 border-b border-dark-border">
              <h3 className="text-sm font-medium text-dark-text mb-2">Notes</h3>
              <p className="text-sm text-dark-text-muted whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {/* Subtasks Section */}
          <div className="px-6 py-4 border-b border-dark-border">
            <h3 className="text-sm font-medium text-dark-text mb-3">
              Subtasks ({subtasks.length})
            </h3>
            <div className="space-y-2 mb-3">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-2 bg-dark-surface rounded border border-dark-border"
                >
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={(e) =>
                      handleSubtaskStatusChange(
                        subtask.id,
                        e.target.checked ? 'done' : 'todo'
                      )
                    }
                    className="w-4 h-4 rounded border-dark-border"
                  />
                  <span
                    className={clsx(
                      'flex-1 text-sm',
                      subtask.status === 'done'
                        ? 'text-dark-text-muted line-through'
                        : 'text-dark-text'
                    )}
                  >
                    {subtask.title}
                  </span>
                  {subtask.assigneeName && (
                    <Avatar name={subtask.assigneeName} size="xs" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-dark-text mb-3">
              Comments ({topLevelComments.length})
            </h3>
            <div className="space-y-1 mb-4">
              {topLevelComments.map((comment) => {
                const replies = getThreadReplies(comment.id)
                return (
                  <div key={comment.id}>
                    <Message
                      message={comment}
                      onReply={() => setOpenThread(comment)}
                      onQuote={() => setOpenThread(comment)}
                    />
                    {replies.length > 0 && (
                      <button
                        onClick={() => setOpenThread(comment)}
                        className="ml-14 text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <MessageSquare size={12} />
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
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
