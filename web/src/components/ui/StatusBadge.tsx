import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: 'todo' | 'doing' | 'done'
}

const colors = {
  todo: 'bg-gray-600 text-gray-200',
  doing: 'bg-blue-600 text-blue-100',
  done: 'bg-green-600 text-green-100',
}

const labels = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        colors[status]
      )}
    >
      {labels[status]}
    </span>
  )
}
