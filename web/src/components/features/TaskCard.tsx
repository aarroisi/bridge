import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Task } from "@/types";
import { clsx } from "clsx";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isSelected?: boolean;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  onClick,
  isSelected,
  isDragging,
}: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-dark-surface border border-dark-border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors",
        isSelected && "border-blue-500 ring-1 ring-blue-500",
        isDragging && "shadow-lg ring-2 ring-blue-500 opacity-90",
      )}
    >
      <h4 className="font-medium text-dark-text text-sm mb-2">{task.title}</h4>

      {(task.assigneeName || task.dueOn) && (
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
              <span>{format(new Date(task.dueOn), "MMM d")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
