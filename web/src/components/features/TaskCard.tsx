import { Calendar, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Task } from '@/types'
import { clsx } from 'clsx'

interface TaskCardProps {
  task: Task
  onClick: () => void
  isSelected?: boolean
}

export function TaskCard({ task, onClick, isSelected }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-dark-surface border border-dark-border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors',
        isSelected && 'border-blue-500 ring-1 ring-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-dark-text text-sm flex-1">{task.title}</h4>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-dark-text-muted">
        {task.assigneeName && (
          <div className="flex items-center gap-1">
            <Avatar name={task.assigneeName} size="xs" />
            <span>{task.assigneeName}</span>
          </div>
        )}

        {task.dueOn && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{format(new Date(task.dueOn), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
