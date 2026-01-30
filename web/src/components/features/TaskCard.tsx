import { Calendar, StickyNote } from "lucide-react";
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
        "bg-dark-surface border border-dark-border rounded-lg px-3 pt-3 pb-2 cursor-pointer hover:border-blue-500 transition-colors",
        isSelected && "border-blue-500 ring-1 ring-blue-500",
        isDragging && "shadow-lg ring-2 ring-blue-500 opacity-90",
      )}
    >
      <h4 className="font-medium text-dark-text text-sm mb-2">{task.title}</h4>

      <div className="flex items-center gap-3 text-xs text-dark-text-muted flex-wrap">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <Avatar name={task.assignee.name} size="xs" />
            <span>{task.assignee.name}</span>
          </div>
        )}

        {task.dueOn && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{format(new Date(task.dueOn), "MMM d")}</span>
          </div>
        )}

        {task.notes && task.notes.replace(/<[^>]*>/g, "").trim() && (
          <StickyNote size={12} title="Has notes" />
        )}

        {task.createdBy && (
          <span className="text-[11px]">
            Added by {task.createdBy.name} on{" "}
            {format(new Date(task.insertedAt), "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
}
